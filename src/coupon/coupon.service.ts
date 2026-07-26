import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Coupon, CouponDocument, DiscountType, ApplicableTo } from './schemas/coupon.schema';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { CouponResponseDto } from './dto/responses/coupon-response.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
  ) {}

  // ============= 1. إنشاء قسيمة جديدة =============
  async create(createDto: CreateCouponDto): Promise<CouponResponseDto> {
    // التحقق من أن valid_from < valid_to
    const from = new Date(createDto.valid_from);
    const to = new Date(createDto.valid_to);
    if (from >= to) {
      throw new BadRequestException('valid_from must be earlier than valid_to');
    }

    // التحقق من فريدة الـ code
    await this.ensureCodeIsUnique(createDto.code);

    // بناء الكائن النهائي
    const newCoupon = new this.couponModel({
      ...createDto,
      valid_from: from,
      valid_to: to,
      usage_count: 0,
    });

    const saved = await newCoupon.save();
    return CouponResponseDto.fromEntity(saved);
  }

  // ============= 2. جلب كل القسائم (للأدمن) =============
  async findAllAdmin(
    page: number = 1,
    limit: number = 10,
    filters?: {
      search?: string;
      discount_type?: DiscountType;
      is_active?: boolean;
      is_expired?: boolean;
    },
  ): Promise<{ data: CouponResponseDto[]; total: number; page: number; lastPage: number }> {
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (filters?.search) {
      filter.code = { $regex: `^${filters.search.toUpperCase().trim()}` }; 
    }

    if (filters?.discount_type) {
      filter.discount_type = filters.discount_type;
    }

    if (filters?.is_active !== undefined) {
      filter.is_active = filters.is_active;
    }

    if (filters?.is_expired) {
      filter.valid_to = { $lt: new Date() };
    }

    const [data, total] = await Promise.all([
      this.couponModel
        .find(filter)
        .sort({ valid_from: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.couponModel.countDocuments(filter).exec(),
    ]);

    return {
      data: CouponResponseDto.fromEntityArray(data),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  // ============= 3. جلب القسيمة بواسطة ID =============
  async findOneById(id: string): Promise<CouponResponseDto> {
    const coupon = await this.couponModel.findById(id).lean().exec();
    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }
    return CouponResponseDto.fromEntity(coupon);
  }

  // ============= 4. جلب القسيمة بواسطة Code =============
  async findOneByCode(code: string): Promise<CouponResponseDto> {
    const coupon = await this.couponModel
      .findOne({ code: code.toUpperCase().trim() })
      .lean()
      .exec();
    if (!coupon) {
      throw new NotFoundException(`Coupon with code "${code}" not found`);
    }
    return CouponResponseDto.fromEntity(coupon);
  }

  // ============= 5. تحديث قسيمة =============
  async update(id: string, updateDto: UpdateCouponDto): Promise<CouponResponseDto> {
    const currentCoupon = await this.couponModel.findById(id).exec();
    if (!currentCoupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

     // رفض تحديث usage_count
    if (updateDto.usage_count !== undefined) {
      throw new BadRequestException('Cannot update usage_count directly. It is incremented automatically.');
    }

    // إذا تم تغيير الـ Code، تأكد من أنه فريد
    if (updateDto.code && updateDto.code !== currentCoupon.code) {
      await this.ensureCodeIsUnique(updateDto.code, id);
    }

    // التحقق من صحة التواريخ
    const validFrom = updateDto.valid_from ? new Date(updateDto.valid_from) : currentCoupon.valid_from;
    const validTo = updateDto.valid_to ? new Date(updateDto.valid_to) : currentCoupon.valid_to;
    if (validFrom >= validTo) {
      throw new BadRequestException('valid_from must be earlier than valid_to');
    }

    // منع تحديث usage_count مباشرة (يتم تحديثها فقط عند الاستخدام)
    const { usage_count, ...safeUpdate } = updateDto;

    const updatedCoupon = await this.couponModel
      .findByIdAndUpdate(
        id,
        {
          ...safeUpdate,
          valid_from: validFrom,
          valid_to: validTo,
        },
        { returnDocument: 'after', runValidators: true },
      )
      .lean()
      .exec();

    if (!updatedCoupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    return CouponResponseDto.fromEntity(updatedCoupon);
  }

  // ============= 6. حذف (تعطيل) قسيمة =============
  async remove(id: string): Promise<{ message: string }> {
    const coupon = await this.findOneById(id);
    await this.couponModel.findByIdAndUpdate(id, { is_active: false }).exec();
    return { message: 'Coupon deactivated successfully' };
  }

  // ============= 7. **القلب النابض: التحقق من صحة القسيمة وحساب الخصم** =============
  async validateCoupon(validateDto: ValidateCouponDto): Promise<{
    valid: boolean;
    message: string;
    discount_amount: number;
    final_total: number;
    coupon?: CouponResponseDto;
  }> {
    const { code, order_total, user_id, product_ids } = validateDto;

    // 1. جلب القسيمة
    const coupon = await this.couponModel.findOne({ code }).lean().exec();
    if (!coupon) {
      return {
        valid: false,
        message: 'Coupon code not found',
        discount_amount: 0,
        final_total: order_total,
      };
    }

    // 2. التحقق من الحالة
    if (!coupon.is_active) {
      return {
        valid: false,
        message: 'Coupon is deactivated',
        discount_amount: 0,
        final_total: order_total,
      };
    }

    // 3. التحقق من الصلاحية (التواريخ)
    const now = new Date();
    if (now < coupon.valid_from) {
      return {
        valid: false,
        message: `Coupon is not valid yet. Valid from: ${coupon.valid_from.toISOString().split('T')[0]}`,
        discount_amount: 0,
        final_total: order_total,
      };
    }
    if (now > coupon.valid_to) {
      return {
        valid: false,
        message: 'Coupon has expired',
        discount_amount: 0,
        final_total: order_total,
      };
    }

    // 4. التحقق من حد الاستخدام الإجمالي
    if (coupon.usage_count >= coupon.usage_limit) {
      return {
        valid: false,
        message: 'Coupon usage limit has been reached',
        discount_amount: 0,
        final_total: order_total,
      };
    }

    // 5. التحقق من الحد الأدنى للطلب
    if (order_total < coupon.minimum_order_amount) {
      return {
        valid: false,
        message: `Minimum order amount is ${coupon.minimum_order_amount}`,
        discount_amount: 0,
        final_total: order_total,
      };
    }

    // 6. التحقق من نطاق التطبيق (Applicability)
    if (coupon.applicable_to !== ApplicableTo.ALL) {
      // هذه نقطة معقدة، لأن المنتجات قد لا تكون متوفرة في هذا السياق.
      // سنفترض أن product_ids تم إرسالها في الطلب.
      // سنقوم بالتحقق البسيط هنا، لكن الأفضل تخصيص هذه المنطق حسب المتطلبات.
      if (!product_ids || product_ids.length === 0) {
        return {
          valid: false,
          message: 'This coupon requires specific products/categories/brands to be applied',
          discount_amount: 0,
          final_total: order_total,
        };
      }

      // تحقق بسيط: إذا كانت القسيمة محددة لفئات معينة، نتحقق من تطابق أي من المنتجات مع هذه الفئات
      // هذا يتطلب جلب المنتجات من قاعدة البيانات، لذا سنؤجله إلى وحدة Product عندما يتم بناؤها.
      // سنكتفي بتحذير أن المنطق يحتاج إلى تطوير إضافي.
      // (ملاحظة: في هذا الإصدار، سنمرر التحقق بشكل مبسط، لكن في الإنتاج يجب ربطه بجدول المنتجات).
    }

    // 7. حساب الخصم
    let discountAmount = 0;
    if (coupon.discount_type === DiscountType.PERCENTAGE) {
      discountAmount = (order_total * coupon.discount_value) / 100;
      // تطبيق الحد الأقصى للخصم إن وجد
      if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
        discountAmount = coupon.max_discount_amount;
      }
    } else if (coupon.discount_type === DiscountType.FIXED) {
      discountAmount = coupon.discount_value;
      // لا يمكن أن يتجاوز الخصم قيمة الطلب
      if (discountAmount > order_total) {
        discountAmount = order_total;
      }
    }

    const finalTotal = order_total - discountAmount;

    return {
      valid: true,
      message: 'Coupon applied successfully',
      discount_amount: Math.round(discountAmount * 100) / 100,
      final_total: Math.round(finalTotal * 100) / 100,
      coupon: CouponResponseDto.fromEntity(coupon),
    };
  }

  // ============= 8. تسجيل استخدام القسيمة (زيادة الـ usage_count) =============
  async incrementUsage(code: string): Promise<CouponResponseDto> {
    const coupon = await this.couponModel
      .findOneAndUpdate(
        { code },
        { $inc: { usage_count: 1 } },
        { new: true },
      )
      .lean()
      .exec();

    if (!coupon) {
      throw new NotFoundException(`Coupon with code "${code}" not found`);
    }

    return CouponResponseDto.fromEntity(coupon);
  }

  // ============= دوال مساعدة (Helpers) =============

  private async ensureCodeIsUnique(code: string, excludeId?: string): Promise<void> {
    const query: any = { code: code.toUpperCase().trim() };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const existing = await this.couponModel.findOne(query).lean().exec();
    if (existing) {
      throw new ConflictException(`Coupon code "${code}" is already taken`);
    }
  }
}