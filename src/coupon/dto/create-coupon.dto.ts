import {
  IsString,
  IsNotEmpty,
  MaxLength,
  MinLength,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsEnum,
  IsDateString,
  IsArray,
  IsMongoId,
  ValidateIf,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { DiscountType, ApplicableTo } from '../schemas/coupon.schema';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty({ message: 'Coupon code is required' })
  @MinLength(3, { message: 'Code must be at least 3 characters' })
  @MaxLength(20, { message: 'Code must not exceed 20 characters' })
  @Transform(({ value }) => value.toUpperCase().trim())
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description is too long' })
  description?: string;

  @IsEnum(DiscountType)
  @IsNotEmpty({ message: 'Discount type is required' })
  discount_type!: DiscountType;

  @IsNumber()
  @Min(0, { message: 'Discount value must be >= 0' })
  @Max(100, { message: 'Percentage discount cannot exceed 100' })
  @Transform(({ value }) => parseFloat(value))
  discount_value!: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Minimum order amount must be >= 0' })
  @Transform(({ value }) => parseFloat(value))
  minimum_order_amount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Max discount amount must be >= 0' })
  @Transform(({ value }) => parseFloat(value))
  max_discount_amount?: number;

  @IsDateString({}, { message: 'Invalid start date format' })
  valid_from!: string;

  @IsDateString({}, { message: 'Invalid end date format' })
  valid_to!: string;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Usage limit must be at least 1' })
  @Transform(({ value }) => parseInt(value))
  usage_limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Per user limit must be >= 0' })
  @Transform(({ value }) => parseInt(value))
  per_user_limit?: number;

  @IsEnum(ApplicableTo)
  @IsNotEmpty({ message: 'Applicable to is required' })
  applicable_to!: ApplicableTo;

  @ValidateIf(o => o.applicable_to === ApplicableTo.CATEGORIES)
  @IsArray()
  @IsMongoId({ each: true, message: 'Each category ID must be a valid ObjectId' })
  applicable_category_ids?: string[];

  @ValidateIf(o => o.applicable_to === ApplicableTo.BRANDS)
  @IsArray()
  @IsMongoId({ each: true, message: 'Each brand ID must be a valid ObjectId' })
  applicable_brand_ids?: string[];

  @ValidateIf(o => o.applicable_to === ApplicableTo.PRODUCTS)
  @IsArray()
  @IsMongoId({ each: true, message: 'Each product ID must be a valid ObjectId' })
  applicable_product_ids?: string[];
}