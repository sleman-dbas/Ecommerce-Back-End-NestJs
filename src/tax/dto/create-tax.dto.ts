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
  IsBoolean,
  IsArray,
  IsMongoId,
  ValidateIf,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TaxType, ApplicableTo } from '../schemas/tax.schema';

export class CreateTaxDto {
  @IsString()
  @IsNotEmpty({ message: 'Tax name is required' })
  @MinLength(3, { message: 'Tax name must be at least 3 characters' })
  @MaxLength(100, { message: 'Tax name must not exceed 100 characters' })
  name!: string;

  @IsEnum(TaxType)
  @IsNotEmpty({ message: 'Tax type is required' })
  type!: TaxType;

  @IsNumber()
  @Min(0, { message: 'Tax rate must be >= 0' })
  @Max(100, { message: 'Percentage tax rate cannot exceed 100' })
  @Transform(({ value }) => parseFloat(value))
  rate!: number;

  @IsEnum(ApplicableTo)
  @IsNotEmpty({ message: 'Applicable scope is required' })
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

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  is_global?: boolean;

  @ValidateIf(o => !o.is_global)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ValidateIf(o => !o.is_global)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ValidateIf(o => !o.is_global)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ValidateIf(o => !o.is_global)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postal_code?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(value))
  priority?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  is_active?: boolean;
}