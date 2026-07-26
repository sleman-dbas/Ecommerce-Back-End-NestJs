import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CouponsService } from './coupon.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { FilterCouponsDto } from './dto/filter-coupons.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { CouponResponseDto } from './dto/responses/coupon-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorators';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  // =============== مسارات الأدمن (Admin) ===============

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCouponDto: CreateCouponDto): Promise<CouponResponseDto> {
    return this.couponsService.create(createCouponDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin')
  findAllAdmin(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query() filters: FilterCouponsDto,
  ): Promise<{ data: CouponResponseDto[]; total: number; page: number; lastPage: number }> {
    return this.couponsService.findAllAdmin(page, limit, {
      search: filters.search,
      discount_type: filters.discount_type,
      is_active: filters.is_active,
      is_expired: filters.is_expired,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/:id')
  findOneForAdmin(@Param('id') id: string): Promise<CouponResponseDto> {
    return this.couponsService.findOneById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/:id')
  update(@Param('id') id: string, @Body() updateCouponDto: UpdateCouponDto): Promise<CouponResponseDto> {
    return this.couponsService.update(id, updateCouponDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.couponsService.remove(id);
  }

  // =============== مسارات العميل (Public) ===============

  // التحقق من صحة القسيمة (يستخدم أثناء عملية الدفع)
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

  // جلب قسيمة بواسطة الكود (للعميل - لعرض التفاصيل قبل الدفع)
  @Get('code/:code')
  findOneByCode(@Param('code') code: string): Promise<CouponResponseDto> {
    return this.couponsService.findOneByCode(code);
  }
}