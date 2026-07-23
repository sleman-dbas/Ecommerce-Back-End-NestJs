import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { UpdateProfileDto } from '../dto/UpdateProfile.dto';
import * as bcrypt from 'bcrypt';
import { UserResponseDto } from '../../common/dto/responses/user-response.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.userModel.findById(userId).select('-password -__v').lean().exec();
    if (!user) throw new NotFoundException('User not found');
    return UserResponseDto.fromEntity(user);
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<UserResponseDto> {

    const user = await this.userModel
      .findByIdAndUpdate(userId, updateProfileDto, { new: true, runValidators: true })
      .select('-password -__v')
      .lean()
      .exec();

    if (!user) throw new NotFoundException('User not found');
    return UserResponseDto.fromEntity(user);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<UserResponseDto> {
    const { oldPassword, newPassword } = changePasswordDto;
    const user = await this.userModel.findById(userId).select('+password');
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) throw new BadRequestException('Old password is incorrect');

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return UserResponseDto.fromEntity(user);
  }
}