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
import { SuppliersService } from '../supplier.service';
import { CreateSupplierDto } from '../dto/create-supplier.dto';
import { UpdateSupplierDto } from '../dto/update-supplier.dto';
import { FilterSuppliersDto } from '../dto/filter-suppliers.dto';
import { SupplierResponseDto } from '../dto/responses/supplier-response.dto';

@Controller('admin/suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class SupplierAdminController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createSupplierDto: CreateSupplierDto): Promise<SupplierResponseDto> {
    return this.suppliersService.create(createSupplierDto);
  }

  @Get()
  findAllAdmin(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query() filters: FilterSuppliersDto,
  ): Promise<{ data: SupplierResponseDto[]; total: number; page: number; lastPage: number }> {
    return this.suppliersService.findAllAdmin(page, limit, {
      search: filters.search,
      is_active: filters.is_active,
      sort_by: filters.sort_by,
      sort_order: filters.sort_order as 'asc' | 'desc',
    });
  }

  @Get(':id')
  findOneForAdmin(@Param('id') id: string): Promise<SupplierResponseDto> {
    return this.suppliersService.findOneById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSupplierDto: UpdateSupplierDto): Promise<SupplierResponseDto> {
    return this.suppliersService.update(id, updateSupplierDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.suppliersService.remove(id);
  }
}