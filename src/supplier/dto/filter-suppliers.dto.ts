import { IsOptional, IsString, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class FilterSuppliersDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(0)
  page?: number = 1;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  is_active?: boolean;

  @IsOptional()
  @IsString()
  sort_by?: 'name' | 'rating' | 'sort_order' | 'createdAt';

  @IsOptional()
  @IsString()
  sort_order?: 'asc' | 'desc';
}