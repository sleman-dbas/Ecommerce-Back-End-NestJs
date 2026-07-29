import { Expose, Type } from 'class-transformer';
import { Types } from 'mongoose';
import { RequestStatus } from '../../schemas/product-request.schema';

export class ProductRequestResponseDto {
  @Expose()
  @Type(() => String)
  _id!: Types.ObjectId;

  @Expose()
  product_name!: string;

  @Expose()
  description?: string;

  @Expose()
  product_url?: string;

  @Expose()
  @Type(() => String)
  user_id?: Types.ObjectId;

  @Expose()
  user?: any; // عند الـ populate

  @Expose()
  customer_email?: string;

  @Expose()
  customer_name?: string;

  @Expose()
  @Type(() => String)
  suggested_category_id?: Types.ObjectId;

  @Expose()
  suggested_category?: any; // عند الـ populate

  @Expose()
  status!: RequestStatus;

  @Expose()
  admin_notes?: string;

  @Expose()
  request_count!: number;

  @Expose()
  is_active!: boolean;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  static fromEntity(entity: any): ProductRequestResponseDto {
    return {
      _id: entity._id,
      product_name: entity.product_name,
      description: entity.description,
      product_url: entity.product_url,
      user_id: entity.user_id,
      user: entity.user,
      customer_email: entity.customer_email,
      customer_name: entity.customer_name,
      suggested_category_id: entity.suggested_category_id,
      suggested_category: entity.suggested_category,
      status: entity.status,
      admin_notes: entity.admin_notes,
      request_count: entity.request_count,
      is_active: entity.is_active,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    } as ProductRequestResponseDto;
  }

  static fromEntityArray(entities: any[]): ProductRequestResponseDto[] {
    return entities.map((e) => this.fromEntity(e));
  }
}