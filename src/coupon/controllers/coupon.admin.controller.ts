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
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorators';
import { CouponsService } from '../coupon.service';
import { CreateCouponDto } from '../dto/create-coupon.dto';
import { UpdateCouponDto } from '../dto/update-coupon.dto';
import { FilterCouponsDto } from '../dto/filter-coupons.dto';
import { CouponResponseDto } from '../dto/responses/coupon-response.dto';

@Controller('admin/coupons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class CouponAdminController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCouponDto: CreateCouponDto): Promise<CouponResponseDto> {
    return this.couponsService.create(createCouponDto);
  }

  @Get()
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

  @Get(':id')
  findOneForAdmin(@Param('id') id: string): Promise<CouponResponseDto> {
    return this.couponsService.findOneById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCouponDto: UpdateCouponDto): Promise<CouponResponseDto> {
    return this.couponsService.update(id, updateCouponDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.couponsService.remove(id);
  }
}