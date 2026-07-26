import { Expose, Type } from 'class-transformer';
import { Types } from 'mongoose';
import { DiscountType, ApplicableTo } from '../../schemas/coupon.schema';

export class CouponResponseDto {
  @Expose()
  @Type(() => String)
  _id!: Types.ObjectId;

  @Expose()
  code!: string;

  @Expose()
  description?: string;

  @Expose()
  discount_type!: DiscountType;

  @Expose()
  discount_value!: number;

  @Expose()
  minimum_order_amount!: number;

  @Expose()
  max_discount_amount?: number;

  @Expose()
  valid_from!: Date;

  @Expose()
  valid_to!: Date;

  @Expose()
  usage_limit!: number;

  @Expose()
  usage_count!: number;

  @Expose()
  per_user_limit!: number;

  @Expose()
  applicable_to!: ApplicableTo;

  @Expose()
  @Type(() => String)
  applicable_category_ids?: Types.ObjectId[];

  @Expose()
  @Type(() => String)
  applicable_brand_ids?: Types.ObjectId[];

  @Expose()
  @Type(() => String)
  applicable_product_ids?: Types.ObjectId[];

  @Expose()
  is_active!: boolean;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  // ============= دوال مساعدة للتحويل =============
  static fromEntity(entity: any): CouponResponseDto {
    return {
      _id: entity._id,
      code: entity.code,
      description: entity.description,
      discount_type: entity.discount_type,
      discount_value: entity.discount_value,
      minimum_order_amount: entity.minimum_order_amount,
      max_discount_amount: entity.max_discount_amount,
      valid_from: entity.valid_from,
      valid_to: entity.valid_to,
      usage_limit: entity.usage_limit,
      usage_count: entity.usage_count,
      per_user_limit: entity.per_user_limit,
      applicable_to: entity.applicable_to,
      applicable_category_ids: entity.applicable_category_ids,
      applicable_brand_ids: entity.applicable_brand_ids,
      applicable_product_ids: entity.applicable_product_ids,
      is_active: entity.is_active,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    } as CouponResponseDto;
  }

  static fromEntityArray(entities: any[]): CouponResponseDto[] {
    return entities.map((e) => this.fromEntity(e));
  }
}