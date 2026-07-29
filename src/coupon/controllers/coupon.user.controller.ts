import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { CouponsService } from '../coupon.service';
import { ValidateCouponDto } from '../dto/validate-coupon.dto';
import { CouponResponseDto } from '../dto/responses/coupon-response.dto';

@Controller('coupons')
export class CouponUserController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  validateCoupon(@Body() validateDto: ValidateCouponDto): Promise<{
    valid: boolean;
    message: string;
    discount_amount: number;
    final_total: number;
    coupon?: CouponResponseDto;
  }> {
    return this.couponsService.validateCoupon(validateDto);
  }

  @Get('code/:code')
  findOneByCode(@Param('code') code: string): Promise<CouponResponseDto> {
    return this.couponsService.findOneByCode(code);
  }
}