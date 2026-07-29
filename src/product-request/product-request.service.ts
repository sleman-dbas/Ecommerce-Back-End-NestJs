import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { ProductRequest, ProductRequestDocument, RequestStatus } from './schemas/product-request.schema';
import { CreateProductRequestDto } from './dto/create-product-request.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { ProductRequestResponseDto } from './dto/responses/product-request-response.dto';
import { User } from '../user/schemas/user.schema';

@Injectable()
export class ProductRequestsService {
  constructor(
    @InjectModel(ProductRequest.name)
    private productRequestModel: Model<ProductRequestDocument>,
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  // ============= دالة مساعدة لتطبيع النص =============
private normalizeText(text: string): string {
  return text
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]/g, '');
}

  // ============= 1. إنشاء طلب منتج جديد =============
  async create(
    createDto: CreateProductRequestDto,
    userId?: string,
  ): Promise<ProductRequestResponseDto> {

     if (!userId && !createDto.customer_email) {
      throw new BadRequestException(
        'Customer email is required for guest requests. Please provide your email address.',
      );
    }
    
    let customerEmail = createDto.customer_email;
    let customerName = createDto.customer_name;

    // 1. جلب بيانات المستخدم المسجل بأقل حجم بيانات ممكن
    if (userId) {
      const user = await this.userModel.findById(userId).select('name email').lean().exec();
      if (user) {
        customerEmail = user.email;
        customerName = user.name;
      }
    }

    const normalizedProductName = this.normalizeText(createDto.product_name);
    const userObjectId = userId ? new Types.ObjectId(userId) : null;

    // 2. بناء استعلام البحث المخصص للمسجلين والزوار
    const searchQuery: Record<string, any> = {
      normalized_product_name: normalizedProductName,
      is_active: true,
      status: { $in: [RequestStatus.PENDING, RequestStatus.REVIEWED, RequestStatus.APPROVED] },
    };

    if (userObjectId) {
      searchQuery.user_id = userObjectId;
    } else {
      searchQuery.user_id = null;
      searchQuery.customer_email = customerEmail;
    }

    try {
      const result = await this.productRequestModel
        .findOneAndUpdate(
          searchQuery,
          {
            $inc: { request_count: 1 }, // يزيد 1 إذا كان موجوداً، أو يبدأ بـ 1 إذا كان جديداً
            $setOnInsert: {
              product_name: createDto.product_name,
              normalized_product_name: normalizedProductName,
              description: createDto.description,
              product_url: createDto.product_url,
              customer_email: customerEmail,
              customer_name: customerName,
              user_id: userObjectId,
              suggested_category_id: createDto.suggested_category_id
                ? new Types.ObjectId(createDto.suggested_category_id)
                : null,
              status: RequestStatus.PENDING,
              is_active: true,
            },
          },
          {
            upsert: true,
            returnDocument: 'after',
            setDefaultsOnInsert: true,
          },
        )
        .populate('user_id', 'name email')
        .populate('suggested_category_id', 'name slug')
        .lean()
        .exec();

      return ProductRequestResponseDto.fromEntity(result);
    } catch (error: any) {
      // التعامل مع Race Condition عبر إعادة المحاولة
      if (error.code === 11000) {
        return this.create(createDto, userId);
      }
      throw error;
    }
  }

  // ============= 2. جلب كل الطلبات (للأدمن) =============
  async findAllAdmin(
    page: number = 1,
    limit: number = 10,
    filters?: {
      search?: string;
      status?: RequestStatus;
      sort_by?: string;
    },
  ): Promise<{ data: ProductRequestResponseDto[]; total: number; page: number; lastPage: number }> {
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (filters?.status) {
      filter.status = filters.status;
    }

    if (filters?.search) {
      filter.$text = { $search: filters.search };
    }

    const sortOptions: any = {};
    if (filters?.sort_by === 'request_count') {
      sortOptions.request_count = -1;
    } else if (filters?.sort_by === 'product_name') {
      sortOptions.product_name = 1;
    } else {
      sortOptions.createdAt = -1; // default
    }

    const [data, total] = await Promise.all([
      this.productRequestModel
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('user_id', 'name email')
        .populate('suggested_category_id', 'name slug')
        .lean()
        .exec(),
      this.productRequestModel.countDocuments(filter).exec(),
    ]);

    return {
      data: ProductRequestResponseDto.fromEntityArray(data),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  // ============= 3. جلب طلبات مستخدم معين =============
  async findMyRequests(userId: string): Promise<ProductRequestResponseDto[]> {
    const requests = await this.productRequestModel
      .find({ user_id: userId, is_active: true })
      .sort({ createdAt: -1 })
      .populate('suggested_category_id', 'name slug')
      .lean()
      .exec();

    return ProductRequestResponseDto.fromEntityArray(requests);
  }

  // ============= 4. جلب طلب بواسطة ID (للأدمن) =============
  async findOneById(id: string): Promise<ProductRequestResponseDto> {
    const request = await this.productRequestModel
      .findById(id)
      .populate('user_id', 'name email')
      .populate('suggested_category_id', 'name slug')
      .lean()
      .exec();

    if (!request) {
      throw new NotFoundException(`Product request with ID ${id} not found`);
    }

    return ProductRequestResponseDto.fromEntity(request);
  }

  // ============= 5. تحديث حالة الطلب (للأدمن) =============
  async updateStatus(id: string, statusDto: UpdateRequestStatusDto): Promise<ProductRequestResponseDto> {
    const updated = await this.productRequestModel
      .findByIdAndUpdate(
        id,
        {
          status: statusDto.status,
          admin_notes: statusDto.admin_notes,
        },
        { returnDocument: 'after', runValidators: true },
      )
      .populate('user_id', 'name email')
      .populate('suggested_category_id', 'name slug')
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException(`Product request with ID ${id} not found`);
    }

    return ProductRequestResponseDto.fromEntity(updated);
  }
  // ============= 6. جلب أكثر المنتجات طلباً (للتحليلات) =============
  async getTopRequested(limit: number = 10): Promise<Partial<ProductRequestResponseDto>[]> {
    const results = await this.productRequestModel.aggregate([
      { $match: { is_active: true } },
      {
        $group: {
          _id: '$normalized_product_name',
          product_name: { $first: '$product_name' },
          total_requests: { $sum: '$request_count' },
          descriptions: { $push: '$description' },
          latest: { $max: '$createdAt' },
        },
      },
      { $sort: { total_requests: -1 } },
      { $limit: limit },
    ]).exec();

    return results.map((r) => ({
      product_name: r.product_name,
      request_count: r.total_requests,
      description: r.descriptions[0],
      createdAt: r.latest,
    }));
  }

  // ============= 7. حذف (تعطيل) طلب =============
  async remove(id: string): Promise<{ message: string }> {
    // استخدام findByIdAndUpdate مباشرة (استعلام واحد بدلاً من اثنين)
    const result = await this.productRequestModel
      .findByIdAndUpdate(id, { is_active: false }, { returnDocument: 'after' })
      .lean()
      .exec();

    if (!result) {
      throw new NotFoundException(`Product request with ID ${id} not found`);
    }

    return { message: 'Product request deactivated successfully' };
  }
}