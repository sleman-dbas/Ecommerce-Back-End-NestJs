import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { stat } from 'fs';
@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel:Model<User>
  ) 
  {}
  async create(createUserDto: CreateUserDto):Promise<{status:number , message:string, data:User}> {
    const ifUserExist = await this.userModel.findOne({email:createUserDto.email});

    if(ifUserExist){
      throw new HttpException('User with this email already exists',400)
    }

    const password = bcrypt.hashSync(createUserDto.password, 10);
    const userData = {
      ...createUserDto,
      password,
      role: createUserDto.role ?? 'user',
      active:true,
    };
    const user = await this.userModel.create({...createUserDto, ...userData});
    user.password = password;
    await user.save();
    return {
      status:201,
      message: 'User created successfully',
      data: user,
    };
  }

  findAll() {
    return this.userModel.find().select('-password -__v');  ;
  }

  async findOne(id: string):Promise<{status:number , message:string, data:User}> {
    const user = await this.userModel.findById(id).select('-password -__v');
    if(!user){
      throw new NotFoundException('User not found');
    }
    return {
      status: 200,
      message: 'User found successfully',
      data: user,
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto):Promise<{status:number , message:string,data:User}> {
    const user = await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).select('-password -__v');
    if(!user){
      throw new NotFoundException('User not found');
    }
    return {
      status:200,
      message: 'User updated successfully',
      data: user,
    }; 
  }
  

  async UpdatePassword(id: string, updateUserDto: UpdateUserDto): Promise<{status: number, message: string, data: User}> {
    let hashedPassword: string | undefined;
    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(updateUserDto.password, salt);
    }

    if (!hashedPassword) {
      throw new BadRequestException('Password is required for update');
    }

    const user = await this.userModel.findByIdAndUpdate(
      id, 
      { password: hashedPassword }, 
      { new: true }
    ).select('-password -__v');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      status: 200,
      message: 'Password updated successfully',
      data: user,
    };
  }

  async remove(id: string): Promise<{state:number,  message:string}> {
    const user =  this.userModel.findByIdAndDelete(id).select('-password -__v');
    if(!user){
      throw new NotFoundException('User not found');
    }
    await this.userModel.findByIdAndDelete(id)
    return {
      state: 200,
      message: 'User deleted successfully',
    };
  }
}
