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
import { CategoriesService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { CategoryResponseDto } from './dto/responses/category-response.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // Admin Endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
    return this.categoriesService.create(createCategoryDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin')
  findAllAdmin(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ): Promise<{ data: CategoryResponseDto[]; total: number; page: number; lastPage: number }> {
    return this.categoriesService.findAllAdmin(page, limit);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/:id')
  findOneForAdmin(@Param('id') id: string): Promise<CategoryResponseDto> {
    return this.categoriesService.findOneById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/:id')
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.categoriesService.remove(id);
  }

  // Public Endpoints
  @Get('tree')
  getActiveTree(): Promise<CategoryResponseDto[]> {
    return this.categoriesService.getActiveTree();
  }

  @Get('slug/*path')
  findOneByFullSlug(@Param('path') path: string | string[]): Promise<CategoryResponseDto> {
    const fullSlug = Array.isArray(path) ? path.join('/') : path ?? '';
    return this.categoriesService.findOneByFullSlug(fullSlug);
  }
}