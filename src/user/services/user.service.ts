// src/modules/user/services/user.service.ts
import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../user.schema';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // these api for admin to manage users and for admin to create new users and for admin to update users and for admin to delete users and for admin to get all users and for admin to get a single user by id
  
  async create(createUserDto: CreateUserDto) {
    const existing = await this.userModel.findOne({ email: createUserDto.email });
    if (existing) throw new HttpException('Email already exists', 400);
    const hashed = bcrypt.hashSync(createUserDto.password, 10);
    const user = await this.userModel.create({
      ...createUserDto,
      password: hashed,
      role: createUserDto.role ?? 'customer',
      active: true,
    });
    return { status: 201, message: 'User created successfully', data: user };
  }

  async findAll(query: any) {
    let { limit = 10, skip = 0, sort = 'asc', name, email, role } = query;
    limit = +limit; skip = +skip;
    if (isNaN(limit)) throw new BadRequestException('Invalid limit');
    if (isNaN(skip)) throw new BadRequestException('Invalid skip');
    if (sort && !['asc', 'desc'].includes(sort))
      throw new BadRequestException('Sort must be asc/desc');

    const filter: any = {};
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (email) filter.email = { $regex: email, $options: 'i' };
    if (role) filter.role = { $regex: role, $options: 'i' };

    const users = await this.userModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ name: sort === 'asc' ? 1 : -1 })
      .select('-password -__v');

    return { status: 200, message: 'Users retrieved', length: users.length, data: users };
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).select('-password -__v');
    if (!user) throw new NotFoundException('User not found');
    return { status: 200, message: 'User found', data: user };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select('-password -__v');
    if (!user) throw new NotFoundException('User not found');
    return { status: 200, message: 'User updated', data: user };
  }

  async remove(id: string) {
    const user = await this.userModel.findByIdAndDelete(id);
    if (!user) throw new NotFoundException('User not found');
    return { status: 200, message: 'User deleted' };
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }
}