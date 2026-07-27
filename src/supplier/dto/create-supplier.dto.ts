import {
  IsString,
  IsNotEmpty,
  MaxLength,
  MinLength,
  IsOptional,
  IsEmail,
  IsUrl,
  IsNumber,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty({ message: 'Supplier name is required' })
  @MinLength(2, { message: 'Supplier name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Supplier name must not exceed 100 characters' })
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Description is too long (maximum 1000 characters)' })
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Contact person name must not exceed 100 characters' })
  contact_person?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  @MaxLength(100, { message: 'Email must not exceed 100 characters' })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Phone number must not exceed 20 characters' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Address must not exceed 200 characters' })
  address?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Website must be a valid URL' })
  website?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Logo must be a valid URL' })
  logo?: string;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must not exceed 5' })
  @Transform(({ value }) => parseFloat(value))
  rating?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Sort order must be 0 or greater' })
  @Transform(({ value }) => parseInt(value))
  sort_order?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  is_active?: boolean;
}