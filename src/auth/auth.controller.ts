import { Controller, Post, Body, UseGuards, Get, HttpStatus, HttpCode, UnauthorizedException, Res, Req, Inject } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PasswordResetService } from './services/password-reset.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import { Roles } from './decorators/roles.decorators';
import { RolesGuard } from './guards/role.guard';
import { CurrentUser } from './decorators/user.decorator';
import type { Request, Response } from 'express';  
import { UpdateUserDto } from 'src/user/dto/update-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { ConfigType } from '@nestjs/config';
import appConfig from 'src/config/app.config';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private passwordResetService: PasswordResetService,
    @Inject(appConfig.KEY)
    private readonly appConfiguration: ConfigType<typeof appConfig>,
  ) {} 

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  register(@Body() registerAuthDto: RegisterDto) {
    return this.authService.register(registerAuthDto);
  }


@Post("login")
@HttpCode(HttpStatus.OK)
async login(@Body() loginAuthDto: LoginDto, @Res({ passthrough: true }) res: Response) {
  const { accessToken, refreshToken } = await this.authService.login(loginAuthDto);
  const isProduction = this.appConfiguration.nodeEnv === 'production';
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, 
  });
  
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, 
  });

  return { message: 'Login successful' };
}
  
@Post("refresh-token")
@HttpCode(HttpStatus.OK)
async refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
  const refreshToken = req.cookies['refresh_token'];
  const isProduction = this.appConfiguration.nodeEnv === 'production';
  if (!refreshToken) {
    throw new UnauthorizedException('Refresh token missing');
  }
  
  const { accessToken, refreshToken: newRefreshToken } = await this.authService.refreshToken(refreshToken);
  
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  });
  
  res.cookie('refresh_token', newRefreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  
  return { message: 'Token refreshed' };
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


  // Password reset endpoints
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    return this.passwordResetService.forgotPassword(dto, req.ip ?? 'unknown');
  }

  @Post('verify-reset-code')
  @HttpCode(HttpStatus.OK)
  verifyResetCode(@Body() dto: VerifyResetCodeDto, @Req() req: Request) {
    return this.passwordResetService.verifyResetCode(dto, req.ip ?? 'unknown');
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    return this.passwordResetService.resetPassword(dto, req.ip ?? 'unknown');
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getprofile(@CurrentUser() user : any){
    return user;
  }
}
