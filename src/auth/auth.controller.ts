import { Controller, Post, Body, UseGuards, Get, HttpStatus, HttpCode, UnauthorizedException, Patch, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import { Roles } from './decorators/roles.decorators';
import { RolesGuard } from './guards/role.guard';
import { CurrentUser } from './decorators/user.decorator';
import type { Request, Response } from 'express';  
import { Res, Req } from '@nestjs/common';
import { UpdateUserDto } from 'src/user/dto/update-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {} 

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  register(@Body() registerAuthDto: RegisterDto) {
    return this.authService.register(registerAuthDto);
  }


@Post("login")
@HttpCode(HttpStatus.OK)
async login(@Body() loginAuthDto: LoginDto, @Res({ passthrough: true }) res: Response) {
  const { accessToken, refreshToken } = await this.authService.login(loginAuthDto);
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, 
  });
  
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, 
  });

  return { message: 'Login successful' };
}
  
@Post("refresh-token")
@HttpCode(HttpStatus.OK)
async refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
  const refreshToken = req.cookies['refresh_token'];
  if (!refreshToken) {
    throw new UnauthorizedException('Refresh token missing');
  }
  
  const { accessToken, refreshToken: newRefreshToken } = await this.authService.refreshToken(refreshToken);
  
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  });
  
  res.cookie('refresh_token', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  
  return { message: 'Token refreshed' };
}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getprofile(@CurrentUser() user : any){
    return user;
  }


  @Post('create-admin')
  @Roles("admin")
  @UseGuards(JwtAuthGuard,RolesGuard) // firt should be authonicated user second must be admin user 
  createAdmin(@Body() RegisterAuthDto: RegisterDto){
    return this.authService.createAdmin(RegisterAuthDto);
  }


  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  return { message: 'Logged out successfully' };
  }

}
