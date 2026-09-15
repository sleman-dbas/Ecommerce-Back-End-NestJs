import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ProductsService } from '../product.service';
import { FilterProductsDto } from '../dto/filter-products.dto';

@Controller('products')
export class ProductsPublicController {
  constructor(private readonly productsService: ProductsService) {}

  // ==================== Public Endpoints ====================

  // GET /products/public
  @Get('public')
  findAllPublic(
    @Query() filters: FilterProductsDto,
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.productsService.findAllPublic(filters, cursor, limit);
  }

  // GET /products/category/:fullSlug
  @Get('category/:fullSlug')
  findByCategorySlug(
    @Param('fullSlug') fullSlug: string,
    @Query() filters: FilterProductsDto,
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.productsService.findByCategorySlug(
      fullSlug,
      filters,
      cursor,
      limit,
    );
  }

  // GET /products/slug/:slug
  @Get('slug/:slug')
  findOneBySlug(@Param('slug') slug: string) {
    return this.productsService.findOneBySlug(slug);
  }
}