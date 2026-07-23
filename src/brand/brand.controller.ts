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
} from '@nestjs/common';
import { BrandsService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { FilterBrandsDto } from './dto/filter-brands.dto';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  // =============== مسارات الأدمن (Admin) ===============

  @Post('admin')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createBrandDto: CreateBrandDto) {
    return this.brandsService.create(createBrandDto);
  }

  @Get('admin')
  findAllAdmin(
    @Query() filterDto: FilterBrandsDto,
  ) {
    const { page = 1, limit = 10, search } = filterDto;
    return this.brandsService.findAllAdmin(page, limit, search);
  }

  @Get('admin/:id')
  findOneForAdmin(@Param('id') id: string) {
    return this.brandsService.findOneById(id);
  }

  @Patch('admin/:id')
  update(@Param('id') id: string, @Body() updateBrandDto: UpdateBrandDto) {
    return this.brandsService.update(id, updateBrandDto);
  }

  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }

  // =============== مسارات عامة (للعميل) ===============

  @Get('public')
  findAllPublic() {
    return this.brandsService.findAllPublic();
  }

  @Get('public/slug/:slug')
  findOneBySlug(@Param('slug') slug: string) {
    return this.brandsService.findOneBySlug(slug);
  }
}