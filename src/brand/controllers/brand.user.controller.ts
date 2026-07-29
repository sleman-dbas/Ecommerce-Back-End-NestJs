import { Controller, Get, Param } from '@nestjs/common';
import { BrandsService } from '../brand.service';

@Controller('brands')
export class BrandUserController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get('public')
  findAllPublic() {
    return this.brandsService.findAllPublic();
  }

  @Get('public/slug/:slug')
  findOneBySlug(@Param('slug') slug: string) {
    return this.brandsService.findOneBySlug(slug);
  }
}