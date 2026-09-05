import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorators';
import { TaxesService } from '../tax.service';
import { CreateTaxDto } from '../dto/create-tax.dto';
import { UpdateTaxDto } from '../dto/update-tax.dto';
import { FilterTaxesDto } from '../dto/filter-taxes.dto';
import { TaxResponseDto } from '../dto/responses/tax-response.dto';

@Controller('admin/taxes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class TaxesAdminController {
  constructor(private readonly taxesService: TaxesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateTaxDto): Promise<TaxResponseDto> {
    return this.taxesService.create(createDto);
  }

  @Get()
  findAll(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query() filters: FilterTaxesDto,
  ): Promise<{ data: TaxResponseDto[]; total: number; page: number; lastPage: number }> {
    return this.taxesService.findAllAdmin(page, limit, {
      name: filters.name,
      type: filters.type,
      is_active: filters.is_active,
      is_global: filters.is_global,
      country: filters.country,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<TaxResponseDto> {
    return this.taxesService.findOneById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateTaxDto): Promise<TaxResponseDto> {
    return this.taxesService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.taxesService.remove(id);
  }
}