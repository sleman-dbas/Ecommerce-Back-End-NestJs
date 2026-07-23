import {
  IsString,
  IsNotEmpty,
  MaxLength,
  MinLength,
  IsOptional,
  IsUrl,
  IsNumber,
  Min,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty({ message: 'Brand name is required' })
  @MinLength(2, { message: 'Brand name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Brand name must not exceed 50 characters' })
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description is too long (maximum 500 characters)' })
  description?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Logo URL must be a valid URL' })
  logo?: string;

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