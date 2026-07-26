import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsMongoId } from 'class-validator';
import { Transform } from 'class-transformer';

export class ValidateCouponDto {
  @IsString()
  @IsNotEmpty({ message: 'Coupon code is required' })
  @Transform(({ value }) => value.toUpperCase().trim())
  code!: string;

  @IsNumber()
  @Min(0, { message: 'Order total must be >= 0' })
  @Transform(({ value }) => parseFloat(value))
  order_total!: number;

  @IsOptional()
  @IsMongoId()
  user_id?: string; // لتطبيق per_user_limit

  @IsOptional()
  @IsMongoId({ each: true })
  product_ids?: string[]; // للتحقق من applicability
}