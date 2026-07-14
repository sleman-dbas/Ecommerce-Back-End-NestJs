// src/modules/user/services/user.service.ts
import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../user.schema';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../../common/dto/responses/user-response.dto';
import { PaginationQueryDto } from '../dto/pagination-query.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // these api for admin to manage users and for admin to create new users and for admin to update users and for admin to delete users and for admin to get all users and for admin to get a single user by id
  
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const existing = await this.userModel.findOne({ email: createUserDto.email }).lean().exec();
    if (existing) throw new HttpException('Email already exists', 400);
    const hashed = bcrypt.hashSync(createUserDto.password, 10);
    const user = await this.userModel.create({
      ...createUserDto,
      password: hashed,
      role: createUserDto.role ?? 'customer',
      active: true,
    });
    return UserResponseDto.fromEntity(user);
  }

  async findAll(query: PaginationQueryDto): Promise<{ 
    data: UserResponseDto[]; 
    total: number; 
    page: number; 
    lastPage: number; 
  }> {
    const { page = 1, limit = 10, sort = 'asc', name, email, role } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (email) filter.email = { $regex: email, $options: 'i' };
    if (role) filter.role = { $regex: role, $options: 'i' };

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .skip(skip)
        .limit(Number(limit))
        .sort({ name: sort === 'asc' ? 1 : -1 })
        .select('-password -__v')
        .lean()
        .exec(),
      this.userModel.countDocuments(filter).exec(), 
    ]);

    return {
      data: UserResponseDto.fromEntity(users),
      total,
      page: Number(page),
      lastPage: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.userModel.findById(id).select('-password -__v').lean().exec();
    if (!user) throw new NotFoundException('User not found');
    return UserResponseDto.fromEntity(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select('-password -__v')
      .lean()
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return UserResponseDto.fromEntity(user);
  }

  async remove(id: string): Promise<{ status: number; message: string }> {
    const user = await this.userModel.findByIdAndDelete(id);
    if (!user) throw new NotFoundException('User not found');
    return { status: 200, message: 'User deleted' };
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).lean().exec();
  }

  async findById(id: string): Promise<any | null> {
    return this.userModel.findById(id).lean().exec();
  }
}