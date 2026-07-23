import { Expose, Type } from 'class-transformer';
import { Types } from 'mongoose';

export class BrandResponseDto {
  @Expose()
  @Type(() => String)
  _id!: Types.ObjectId;

  @Expose()
  name!: string;

  @Expose()
  slug!: string;

  @Expose()
  description?: string;

  @Expose()
  logo?: string;

  @Expose()
  sort_order!: number;

  @Expose()
  is_active!: boolean;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  static fromEntity(entity: any): BrandResponseDto {
    return {
      _id: entity._id,
      name: entity.name,
      slug: entity.slug,
      description: entity.description,
      logo: entity.logo,
      sort_order: entity.sort_order,
      is_active: entity.is_active,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    } as BrandResponseDto;
  }

  static fromEntityArray(entities: any[]): BrandResponseDto[] {
    return entities.map((e) => this.fromEntity(e));
  }
}