import { Controller, Get, Param } from '@nestjs/common';
import { SuppliersService } from '../supplier.service';
import { SupplierResponseDto } from '../dto/responses/supplier-response.dto';

@Controller('suppliers')
export class SupplierUserController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get('public')
  findAllPublic(): Promise<SupplierResponseDto[]> {
    return this.suppliersService.findAllPublic();
  }

  @Get('public/slug/:slug')
  findOneBySlug(@Param('slug') slug: string): Promise<SupplierResponseDto> {
    return this.suppliersService.findOneBySlug(slug);
  }
}