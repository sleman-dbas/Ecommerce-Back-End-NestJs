import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tax, TaxDocument, TaxType, ApplicableTo } from './schemas/tax.schema';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
import { TaxResponseDto } from './dto/responses/tax-response.dto';
import { CalculateTaxDto } from './dto/calculate-tax.dto';

@Injectable()
export class TaxesService {
  constructor(
    @InjectModel(Tax.name) private taxModel: Model<TaxDocument>,
  ) {}

  // ============= 1. إنشاء قاعدة ضريبية جديدة =============
  async create(createDto: CreateTaxDto): Promise<TaxResponseDto> {
    // التحقق من عدم وجود تعارض في الموقع (نفس البلد + الولاية + المدينة)

    const newTax = new this.taxModel({
      ...createDto,
    });

    const saved = await newTax.save();
    return TaxResponseDto.fromEntity(saved);
  }

  // ============= 2. جلب كل القواعد الضريبية (للأدمن) =============
  async findAllAdmin(
    page: number = 1,
    limit: number = 10,
    filters?: {
      name?: string;
      type?: TaxType;
      is_active?: boolean;
      is_global?: boolean;
      country?: string;
    },
  ): Promise<{ data: TaxResponseDto[]; total: number; page: number; lastPage: number }> {
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (filters?.name) {
      filter.name = { $regex: filters.name, $options: 'i' };
    }

    if (filters?.type) {
      filter.type = filters.type;
    }

    if (filters?.is_active !== undefined) {
      filter.is_active = filters.is_active;
    }

    if (filters?.is_global !== undefined) {
      filter.is_global = filters.is_global;
    }

    if (filters?.country) {
      filter.country = filters.country;
    }

    const [data, total] = await Promise.all([
      this.taxModel
        .find(filter)
        .sort({ priority: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.taxModel.countDocuments(filter).exec(),
    ]);

    return {
      data: TaxResponseDto.fromEntityArray(data),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  // ============= 3. جلب قاعدة ضريبية بواسطة ID =============
  async findOneById(id: string): Promise<TaxResponseDto> {
    const tax = await this.taxModel.findById(id).lean().exec();
    if (!tax) {
      throw new NotFoundException(`Tax rule with ID ${id} not found`);
    }
    return TaxResponseDto.fromEntity(tax);
  }

  // ============= 4. تحديث قاعدة ضريبية =============
  async update(id: string, updateDto: UpdateTaxDto): Promise<TaxResponseDto> {
    const updatedTax = await this.taxModel
      .findByIdAndUpdate(
        id,
        { ...updateDto },
        { new: true, runValidators: true },
      )
      .lean()
      .exec();

    if (!updatedTax) {
      throw new NotFoundException(`Tax rule with ID ${id} not found`);
    }

    return TaxResponseDto.fromEntity(updatedTax);
  }

  // ============= 5. حذف (تعطيل) قاعدة ضريبية =============
  async remove(id: string): Promise<{ message: string }> {
    const tax = await this.taxModel.findById(id).exec();
    if (!tax) {
      throw new NotFoundException(`Tax rule with ID ${id} not found`);
    }

    await this.taxModel.findByIdAndUpdate(id, { is_active: false }).exec();
    return { message: 'Tax rule deactivated successfully' };
  }

  // ================================================================
  // ============= قلب الوحدة: حساب الضريبة =============
  // ================================================================

  /**
   * حساب الضريبة بناءً على:
   * - الموقع (country, state, city, postal_code)
   * - المنتجات/الفئات/العلامات (لتحديد نطاق التطبيق)
   * - المبلغ الإجمالي
   */
  async calculateTax(calculateDto: CalculateTaxDto): Promise<{
    tax_amount: number;
    total_with_tax: number;
    applied_taxes: TaxResponseDto[];
    breakdown: Array<{ name: string; rate: number; amount: number }>;
  }> {
    const { subtotal, country, state, city, postal_code, product_ids, category_ids, brand_ids } = calculateDto;

    // 1. جلب جميع القواعد الضريبية النشطة
    const query: any = { is_active: true };

    // 2. فلترة حسب الموقع
    // القاعدة: إما global أو تطابق الموقع المحدد
    const locationFilter = {
      $or: [
        { is_global: true },
        {
          $and: [
            { is_global: false },
            // نطابق الحقول التي تم إرسالها فقط
            ...(country ? [{ country }] : []),
            ...(state ? [{ state }] : []),
            ...(city ? [{ city }] : []),
            ...(postal_code ? [{ postal_code }] : []),
          ],
        },
      ],
    };

    query.$and = [locationFilter];

    // 3. جلب القواعد الضريبية المطابقة
    let applicableTaxes = await this.taxModel
      .find(query)
      .sort({ priority: 1 })
      .lean()
      .exec();

    // 4. تصفية حسب نطاق التطبيق (Applicable To)
    applicableTaxes = applicableTaxes.filter((tax) => {
      if (tax.applicable_to === ApplicableTo.ALL) {
        return true;
      }

      if (tax.applicable_to === ApplicableTo.CATEGORIES && category_ids?.length) {
        return tax.applicable_category_ids?.some((catId) =>
          category_ids.some((id) => catId.toString() === id),
        );
      }

      if (tax.applicable_to === ApplicableTo.BRANDS && brand_ids?.length) {
        return tax.applicable_brand_ids?.some((brandId) =>
          brand_ids.some((id) => brandId.toString() === id),
        );
      }

      if (tax.applicable_to === ApplicableTo.PRODUCTS && product_ids?.length) {
        return tax.applicable_product_ids?.some((prodId) =>
          product_ids.some((id) => prodId.toString() === id),
        );
      }

      return false;
    });

    // 5. حساب الضريبة لكل قاعدة مطبقة
    const breakdown: Array<{ name: string; rate: number; amount: number }> = [];
    let totalTax = 0;

    for (const tax of applicableTaxes) {
      let taxAmount = 0;

      if (tax.type === TaxType.PERCENTAGE) {
        taxAmount = (subtotal * tax.rate) / 100;
      } else if (tax.type === TaxType.FIXED) {
        taxAmount = tax.rate; // قيمة ثابتة لكل طلب (أو يمكن ضربها بعدد المنتجات)
      }

      // نضيف الضريبة إلى القائمة
      breakdown.push({
        name: tax.name,
        rate: tax.rate,
        amount: Math.round(taxAmount * 100) / 100,
      });

      totalTax += taxAmount;
    }

    totalTax = Math.round(totalTax * 100) / 100;
    const totalWithTax = Math.round((subtotal + totalTax) * 100) / 100;

    return {
      tax_amount: totalTax,
      total_with_tax: totalWithTax,
      applied_taxes: TaxResponseDto.fromEntityArray(applicableTaxes),
      breakdown,
    };
  }

  // ============= جلب جميع القواعد الضريبية العامة (للعميل) =============
  async findAllPublic(): Promise<TaxResponseDto[]> {
    const taxes = await this.taxModel
      .find({ is_active: true })
      .sort({ priority: 1, name: 1 })
      .lean()
      .exec();

    return TaxResponseDto.fromEntityArray(taxes);
  }
}