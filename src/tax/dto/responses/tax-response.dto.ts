import { Expose, Type } from 'class-transformer';
import { Types } from 'mongoose';
import { TaxType, ApplicableTo } from '../../schemas/tax.schema';

export class TaxResponseDto {
  @Expose()
  @Type(() => String)
  _id!: Types.ObjectId;

  @Expose()
  name!: string;

  @Expose()
  type!: TaxType;

  @Expose()
  rate!: number;

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
  is_global!: boolean;

  @Expose()
  country?: string;

  @Expose()
  state?: string;

  @Expose()
  city?: string;

  @Expose()
  postal_code?: string;

  @Expose()
  priority!: number;

  @Expose()
  is_active!: boolean;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  static fromEntity(entity: any): TaxResponseDto {
    return {
      _id: entity._id,
      name: entity.name,
      type: entity.type,
      rate: entity.rate,
      applicable_to: entity.applicable_to,
      applicable_category_ids: entity.applicable_category_ids,
      applicable_brand_ids: entity.applicable_brand_ids,
      applicable_product_ids: entity.applicable_product_ids,
      is_global: entity.is_global,
      country: entity.country,
      state: entity.state,
      city: entity.city,
      postal_code: entity.postal_code,
      priority: entity.priority,
      is_active: entity.is_active,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    } as TaxResponseDto;
  }

  static fromEntityArray(entities: any[]): TaxResponseDto[] {
    return entities.map((e) => this.fromEntity(e));
  }
}