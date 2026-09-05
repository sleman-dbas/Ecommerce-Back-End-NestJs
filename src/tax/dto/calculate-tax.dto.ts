import { IsNumber, IsOptional, IsString, IsArray, IsMongoId, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CalculateTaxDto {
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  subtotal!: number; // إجمالي قيمة المنتجات قبل الضريبة

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  postal_code?: string;

  // قائمة معرفات المنتجات لتحديد الضرائب المطبقة (لـ applicable_to)
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  product_ids?: string[];

  // قائمة معرفات الفئات لتحديد الضرائب المطبقة
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  category_ids?: string[];

  // قائمة معرفات العلامات التجارية لتحديد الضرائب المطبقة
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  brand_ids?: string[];
}