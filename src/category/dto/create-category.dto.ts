import {
  IsString,
  IsNotEmpty,
  MaxLength,
  MinLength,
  IsOptional,
  IsMongoId,
  IsUrl,
  IsNumber,
  Min,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Category name is required' })
  @MinLength(2, { message: 'Category name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Category name must not exceed 50 characters' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description is too long (maximum 500 characters)' })
  description?: string;

  @IsOptional()
  @IsMongoId({ message: 'Parent ID must be a valid MongoDB ObjectId' })
  parent_id?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Image URL must be a valid URL' })
  image?: string;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Order must be 0 or greater' })
  @Transform(({ value }) => parseInt(value))
  order?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  is_active?: boolean;
}