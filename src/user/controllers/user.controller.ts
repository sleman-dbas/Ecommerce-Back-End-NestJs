import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { Roles } from '../../auth/decorators/roles.decorators';
import { RolesGuard } from '../../auth/guards/role.guard';
import { UserResponseDto } from '../../common/dto/responses/user-response.dto';
import { PaginationQueryDto } from '../dto/pagination-query.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)  // أضف RolesGuard هنا
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles('admin')
  create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.userService.create(createUserDto);
  }

  @Get()
  @Roles('admin')
  findAll(@Query() query: PaginationQueryDto): Promise<{ 
    data: UserResponseDto[]; 
    total: number; 
    page: number; 
    lastPage: number; 
  }> {
    return this.userService.findAll(query);
  }

  @Get(':id')
  @Roles('admin')
  findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string): Promise<{ status: number; message: string }> {
    return this.userService.remove(id);
  }


}