import {
  IsString,
  IsNotEmpty,
  MaxLength,
  MinLength,
  IsOptional,
  IsUrl,
  IsEmail,
  IsMongoId,
} from 'class-validator';

export class CreateProductRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Product name is required' })
  @MinLength(3, { message: 'Product name must be at least 3 characters' })
  @MaxLength(200, { message: 'Product name must not exceed 200 characters' })
  product_name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Description is too long' })
  description?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Invalid product URL' })
  product_url?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  customer_email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Customer name too long' })
  customer_name?: string;

  @IsOptional()
  @IsMongoId({ message: 'Invalid category ID' })
  suggested_category_id?: string;
}