import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { RequestStatus } from '../schemas/product-request.schema';

export class UpdateRequestStatusDto {
  @IsEnum(RequestStatus)
  status!: RequestStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Admin notes too long' })
  admin_notes?: string;
}