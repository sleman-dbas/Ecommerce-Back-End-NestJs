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
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorators';
import { ProductsService } from '.././product.service';
import { CreateProductDto } from '.././dto/create-product.dto';
import {  UpdateProductDto} from '.././dto/update-product.dto';
import { UpdateStockDto } from '../dto/update-stock.dto';
import { FilterProductsDto } from '.././dto/filter-products.dto';

@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ProductsAdminController {
  constructor(private readonly productsService: ProductsService) {}

  // ==================== Admin Endpoints ====================

  // POST /admin/products
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateProductDto) {
    return this.productsService.create(createDto);
  }

  // GET /admin/products
  @Get()
  findAllAdmin(@Query() filters: FilterProductsDto) {
    return this.productsService.findAllAdmin(filters);
  }

  // GET /admin/products/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOneById(id);
  }

  // PATCH /admin/products/:id
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateProductDto) {
    return this.productsService.update(id, updateDto);
  }

  // PATCH /admin/products/:id/stock
  @Patch(':id/stock')
  updateStock(@Param('id') id: string, @Body() stockDto: UpdateStockDto) {
    return this.productsService.updateStock(id, stockDto.quantity);
  }

  // DELETE /admin/products/:id
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}