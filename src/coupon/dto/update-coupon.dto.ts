import { PartialType } from '@nestjs/swagger';
import { CreateCouponDto } from './create-coupon.dto';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateCouponDto extends PartialType(CreateCouponDto) {

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Usage count must be >= 0' })
  usage_count?: number; 
}
