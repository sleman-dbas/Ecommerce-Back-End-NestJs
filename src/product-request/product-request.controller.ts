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
  Req,
} from '@nestjs/common';
import { ProductRequestsService } from './product-request.service';
import { CreateProductRequestDto } from './dto/create-product-request.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { FilterRequestsDto } from './dto/filter-requests.dto';
import { ProductRequestResponseDto } from './dto/responses/product-request-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorators';

@Controller('product-requests')
export class ProductRequestsController {
  constructor(private readonly productRequestsService: ProductRequestsService) {}

  // =============== مسارات العميل (Public - طلب منتج) ===============

  // create for public (not logged in user) vistor 
  @Post('public')
  @HttpCode(HttpStatus.CREATED)
  createPublic(@Body() createDto: CreateProductRequestDto) {
    return this.productRequestsService.create(createDto);
  }

  // create for authenticated user (logged in user)
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createAuthenticated(
    @Req() req: any,
    @Body() createDto: CreateProductRequestDto,
  ) {
    const userId = req.user._id;
    return this.productRequestsService.create(createDto, userId);
  }

  // find my requests for authenticated user
  @UseGuards(JwtAuthGuard)
  @Get('my-requests')
  findMyRequests(@Req() req: any) {
    return this.productRequestsService.findMyRequests(req.user._id);
  }

  // =============== مسارات الأدمن (Admin) ===============

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin')
  findAllAdmin(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query() filters: FilterRequestsDto,
  ) {
    return this.productRequestsService.findAllAdmin(page, limit, {
      search: filters.search,
      status: filters.status,
      sort_by: filters.sort_by,
    });
  }

  // get top requested products for admin
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/top')
  getTopRequested(@Query('limit', ParseIntPipe) limit: number = 10) {
    return this.productRequestsService.getTopRequested(limit);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/:id')
  findOneForAdmin(@Param('id') id: string) {
    return this.productRequestsService.findOneById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/:id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() statusDto: UpdateRequestStatusDto,
  ) {
    return this.productRequestsService.updateStatus(id, statusDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.productRequestsService.remove(id);
  }
}