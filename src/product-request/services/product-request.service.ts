import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProductRequest, ProductRequestDocument, RequestStatus } from '../schemas/product-request.schema';
import { CreateProductRequestDto } from '../dto/create-product-request.dto';
import { FilterRequestsDto } from '../dto/filter-requests.dto';
import { UpdateRequestStatusDto } from '../dto/update-request-status.dto';
import { ProductRequestResponseDto } from '../dto/responses/product-request-response.dto';
import { User } from '../../user/schemas/user.schema';

@Injectable()
export class ProductRequestService {
  constructor(
    @InjectModel(ProductRequest.name)
    private readonly productRequestModel: Model<ProductRequestDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  private normalizeText(text: string): string {
    return text
      .trim()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]/g, '');
  }

  async createPublic(createDto: CreateProductRequestDto): Promise<ProductRequestResponseDto> {
    if (!createDto.customer_email) {
      throw new BadRequestException('Customer email is required for guest requests.');
    }

    return this.createInternal(createDto);
  }

  async createForUser(userId: string, createDto: CreateProductRequestDto): Promise<ProductRequestResponseDto> {
    return this.createInternal(createDto, userId);
  }

  async findMyRequests(userId: string): Promise<ProductRequestResponseDto[]> {
    const requests = await this.productRequestModel
      .find({ user_id: new Types.ObjectId(userId), is_active: true })
      .sort({ createdAt: -1 })
      .populate('suggested_category_id', 'name slug')
      .lean()
      .exec();

    return ProductRequestResponseDto.fromEntityArray(requests);
  }

  async cancelMyRequest(userId: string, requestId: string): Promise<{ message: string }> {
    const result = await this.productRequestModel
      .findOneAndUpdate(
        {
          _id: requestId,
          user_id: new Types.ObjectId(userId),
          is_active: true,
        },
        { is_active: false },
        { returnDocument: 'after' },
      )
      .lean()
      .exec();

    if (!result) {
      throw new NotFoundException('Product request not found or does not belong to the current user');
    }

    return { message: 'Product request cancelled successfully' };
  }

  async findAll(query: FilterRequestsDto): Promise<{
    data: ProductRequestResponseDto[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const filter: Record<string, any> = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search) {
      filter.$text = { $search: query.search };
    }

    const sortOptions: Record<string, 1 | -1> = {};
    if (query.sort_by === 'request_count') {
      sortOptions.request_count = -1;
    } else if (query.sort_by === 'product_name') {
      sortOptions.product_name = 1;
    } else {
      sortOptions.createdAt = -1;
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

    return results.map((item) => ({
      product_name: item.product_name,
      request_count: item.total_requests,
      description: item.descriptions?.[0],
      createdAt: item.latest,
    }));
  }

  async findOne(id: string): Promise<ProductRequestResponseDto> {
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

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.productRequestModel
      .findByIdAndUpdate(id, { is_active: false }, { returnDocument: 'after' })
      .lean()
      .exec();

    if (!result) {
      throw new NotFoundException(`Product request with ID ${id} not found`);
    }

    return { message: 'Product request deactivated successfully' };
  }

  private async createInternal(
    createDto: CreateProductRequestDto,
    userId?: string,
  ): Promise<ProductRequestResponseDto> {
    let customerEmail = createDto.customer_email;
    let customerName = createDto.customer_name;

    if (userId) {
      const user = await this.userModel.findById(userId).select('name email').lean().exec();
      if (user) {
        customerEmail = user.email;
        customerName = user.name;
      }
    }

    const normalizedProductName = this.normalizeText(createDto.product_name);
    const userObjectId = userId ? new Types.ObjectId(userId) : null;

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
            $inc: { request_count: 1 },
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
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
        )
        .populate('user_id', 'name email')
        .populate('suggested_category_id', 'name slug')
        .lean()
        .exec();

      return ProductRequestResponseDto.fromEntity(result);
    } catch (error: any) {
      if (error.code === 11000) {
        return this.createInternal(createDto, userId);
      }
      throw error;
    }
  }
}