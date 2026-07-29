import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorators';
import { CurrentUser } from '../../auth/decorators/user.decorator';
import { ProductRequestService } from '../services/product-request.service';
import { CreateProductRequestDto } from '../dto/create-product-request.dto';

@Controller('product-requests')
export class ProductRequestUserController {
  constructor(private readonly productRequestService: ProductRequestService) {}

  @Post('public')
  @HttpCode(HttpStatus.CREATED)
  createPublic(@Body() createDto: CreateProductRequestDto) {
    return this.productRequestService.createPublic(createDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createForCurrentUser(
    @CurrentUser() user: { id: string },
    @Body() createDto: CreateProductRequestDto,
  ) {
    return this.productRequestService.createForUser(user.id, createDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  @Get('my-requests')
  findMyRequests(@CurrentUser() user: { id: string }) {
    return this.productRequestService.findMyRequests(user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  @Patch('cancel-my-request/:id')
  cancelMyRequest(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.productRequestService.cancelMyRequest(user.id, id);
  }
}