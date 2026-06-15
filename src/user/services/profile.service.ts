import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user.schema';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { UpdateProfileDto } from '../dto/UpdateProfile.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).select('-password -__v');
    if (!user) throw new NotFoundException('User not found');
    return { status: 200, message: 'Profile retrieved successfully', data: user };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {

    const user = await this.userModel
      .findByIdAndUpdate(userId, updateProfileDto, { new: true, runValidators: true })
      .select('-password -__v');

    if (!user) throw new NotFoundException('User not found');
    return { status: 200, message: 'Profile updated successfully', data: user };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { oldPassword, newPassword } = changePasswordDto;
    const user = await this.userModel.findById(userId).select('+password');
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) throw new BadRequestException('Old password is incorrect');

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    const { password, ...result } = user.toObject();
    return { status: 200, message: 'Password updated successfully', data: result };
  }
}