import {
  IsString,
  IsNotEmpty,
  MaxLength,
  MinLength,
  IsOptional,
  IsNumber,
  Min,
  IsMongoId,
  IsBoolean,
  IsArray,
  IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Product name is required' })
  @MinLength(3, { message: 'Name must be at least 3 characters' })
  @MaxLength(200, { message: 'Name must not exceed 200 characters' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'Description is too long' })
  description?: string;

  @IsString()
  @IsNotEmpty({ message: 'SKU is required' })
  @MaxLength(50, { message: 'SKU must not exceed 50 characters' })
  @Transform(({ value }) => value.toUpperCase().trim())
  sku: string;

  @IsNumber()
  @Min(0, { message: 'Price must be >= 0' })
  @Transform(({ value }) => parseFloat(value))
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  compare_at_price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  cost_price?: number;

  @IsNumber()
  @Min(0, { message: 'Stock must be >= 0' })
  @Transform(({ value }) => parseInt(value))
  stock: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(value))
  low_stock_threshold?: number;

  @IsMongoId({ message: 'Invalid category ID' })
  category_id: string;

  @IsOptional()
  @IsMongoId({ message: 'Invalid brand ID' })
  brand_id?: string;

  @IsOptional()
  @IsMongoId({ message: 'Invalid supplier ID' })
  supplier_id?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  is_taxable?: boolean;

  @IsOptional()
  @IsMongoId({ message: 'Invalid tax ID' })
  tax_id?: string;

  @IsUrl({}, { message: 'Invalid main image URL' })
  main_image: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true, message: 'Each gallery image must be a valid URL' })
  gallery?: string[];

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  is_featured?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  is_new?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(value))
  sort_order?: number;
}