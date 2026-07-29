import {
  Controller,
  Get,
  Patch,
  Param,
  Delete,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorators';
import { ProductRequestService } from '../services/product-request.service';
import { FilterRequestsDto } from '../dto/filter-requests.dto';
import { UpdateRequestStatusDto } from '../dto/update-request-status.dto';

@Controller('admin/product-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ProductRequestAdminController {
  constructor(private readonly productRequestService: ProductRequestService) {}

  @Get()
  findAll(@Query() query: FilterRequestsDto) {
    return this.productRequestService.findAll(query);
  }

  @Get('top')
  getTopRequested(@Query('limit') limit?: string) {
    return this.productRequestService.getTopRequested(limit ? Number(limit) : 10);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productRequestService.findOne(id);
  }

  @Patch('update-status/:id')
  updateStatus(
    @Param('id') id: string,
    @Body() statusDto: UpdateRequestStatusDto,
  ) {
    return this.productRequestService.updateStatus(id, statusDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productRequestService.remove(id);
  }
}