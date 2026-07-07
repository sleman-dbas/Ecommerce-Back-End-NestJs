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
import { CurrentUser } from '../../auth/decorators/user.decorator';
import { ProfileService } from '../services/profile.service';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { UpdateProfileDto } from '../dto/UpdateProfile.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorators';

@Controller('profile')
@UseGuards(JwtAuthGuard, RolesGuard)  // أضف RolesGuard هنا
export class ProfileController {
  constructor(private profileService: ProfileService) {}
  @Roles('customer')
  @Get('me')
  getMe(@CurrentUser() user: any) {    
    return {
      status: 200,
      message: 'Current user',
      data: user,
    };
  }
  
  @Roles('customer')
  @Patch('me/password')
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.profileService.changePassword(user.id, changePasswordDto);
  }
  
  @Roles('customer')
  @Patch('me')
  updateProfile(@CurrentUser() user: any, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profileService.updateProfile(user.id, updateProfileDto);
  }
}