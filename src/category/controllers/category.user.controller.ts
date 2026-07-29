import { Controller, Get, Param } from '@nestjs/common';
import { CategoriesService } from '../category.service';
import { CategoryResponseDto } from '../dto/responses/category-response.dto';

@Controller('categories')
export class CategoryUserController {
  constructor(private readonly categoriesService: CategoriesService) {}

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