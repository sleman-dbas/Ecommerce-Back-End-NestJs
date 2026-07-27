import { Expose, Type } from 'class-transformer';
import { Types } from 'mongoose';

export class SupplierResponseDto {
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
  contact_person?: string;

  @Expose()
  email?: string;

  @Expose()
  phone?: string;

  @Expose()
  address?: string;

  @Expose()
  website?: string;

  @Expose()
  logo?: string;

  @Expose()
  rating?: number;

  @Expose()
  sort_order!: number;

  @Expose()
  is_active!: boolean;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  // ============= دوال مساعدة للتحويل =============
  static fromEntity(entity: any): SupplierResponseDto {
    return {
      _id: entity._id,
      name: entity.name,
      slug: entity.slug,
      description: entity.description,
      contact_person: entity.contact_person,
      email: entity.email,
      phone: entity.phone,
      address: entity.address,
      website: entity.website,
      logo: entity.logo,
      rating: entity.rating,
      sort_order: entity.sort_order,
      is_active: entity.is_active,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    } as SupplierResponseDto;
  }

  static fromEntityArray(entities: any[]): SupplierResponseDto[] {
    return entities.map((e) => this.fromEntity(e));
  }
}