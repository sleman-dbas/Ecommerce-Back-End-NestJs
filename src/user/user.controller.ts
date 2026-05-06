import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from './guard/Auth.guard';
import { Roles } from './decorator/user.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  create(@Body() @Req()  req , createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Patch(':id')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  UpdatePassword(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.UpdatePassword(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
