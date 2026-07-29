import { IsOptional, IsString, IsInt, Min, Max, IsEnum, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { RequestStatus } from '../schemas/product-request.schema';

export class FilterRequestsDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @IsOptional()
  @IsString()
  @IsIn(['request_count', 'createdAt', 'product_name'])
  sort_by?: 'request_count' | 'createdAt' | 'product_name';
}