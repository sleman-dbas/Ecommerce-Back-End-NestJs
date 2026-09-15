import { Expose, Type } from 'class-transformer';
import { Types } from 'mongoose';

export class ProductResponseDto {
  @Expose()
  @Type(() => String)
  _id: Types.ObjectId;

  @Expose()
  name: string;

  @Expose()
  slug: string;

  @Expose()
  description?: string;

  @Expose()
  sku: string;

  @Expose()
  price: number;

  @Expose()
  compare_at_price?: number;

  @Expose()
  stock: number;

  @Expose()
  low_stock_threshold: number;

  @Expose()
  @Type(() => String)
  category_id: Types.ObjectId;

  @Expose()
  category?: any;

  @Expose()
  @Type(() => String)
  brand_id?: Types.ObjectId;

  @Expose()
  brand?: any;

  @Expose()
  @Type(() => String)
  supplier_id?: Types.ObjectId;

  @Expose()
  supplier?: any;

  @Expose()
  is_taxable: boolean;

  @Expose()
  @Type(() => String)
  tax_id?: Types.ObjectId;

  @Expose()
  main_image: string;

  @Expose()
  gallery?: string[];

  @Expose()
  is_active: boolean;

  @Expose()
  is_featured: boolean;

  @Expose()
  is_new: boolean;

  @Expose()
  is_on_sale: boolean;

  @Expose()
  sort_order: number;

  @Expose()
  views: number;

  @Expose()
  average_rating: number;

  @Expose()
  review_count: number;

  @Expose()
  sold_count: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  static fromEntity(entity: any): ProductResponseDto {
    return {
      _id: entity._id,
      name: entity.name,
      slug: entity.slug,
      description: entity.description,
      sku: entity.sku,
      price: entity.price,
      compare_at_price: entity.compare_at_price,
      stock: entity.stock,
      low_stock_threshold: entity.low_stock_threshold,
      category_id: entity.category_id,
      category: entity.category,
      brand_id: entity.brand_id,
      brand: entity.brand,
      supplier_id: entity.supplier_id,
      supplier: entity.supplier,
      is_taxable: entity.is_taxable,
      tax_id: entity.tax_id,
      main_image: entity.main_image,
      gallery: entity.gallery,
      is_active: entity.is_active,
      is_featured: entity.is_featured,
      is_new: entity.is_new,
      is_on_sale: entity.is_on_sale,
      sort_order: entity.sort_order,
      views: entity.views,
      average_rating: entity.average_rating,
      review_count: entity.review_count,
      sold_count: entity.sold_count,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    } as ProductResponseDto;
  }

  static fromEntityArray(entities: any[]): ProductResponseDto[] {
    return entities.map((e) => this.fromEntity(e));
  }
}