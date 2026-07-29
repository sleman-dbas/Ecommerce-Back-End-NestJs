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
import { BrandsService } from '../brand.service';
import { CreateBrandDto } from '../dto/create-brand.dto';
import { UpdateBrandDto } from '../dto/update-brand.dto';
import { FilterBrandsDto } from '../dto/filter-brands.dto';

@Controller('admin/brands')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class BrandAdminController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createBrandDto: CreateBrandDto) {
    return this.brandsService.create(createBrandDto);
  }

  @Get()
  findAllAdmin(@Query() filterDto: FilterBrandsDto) {
    const { page = 1, limit = 10, search } = filterDto;
    return this.brandsService.findAllAdmin(page, limit, search);
  }

  @Get(':id')
  findOneForAdmin(@Param('id') id: string) {
    return this.brandsService.findOneById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBrandDto: UpdateBrandDto) {
    return this.brandsService.update(id, updateBrandDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }
}