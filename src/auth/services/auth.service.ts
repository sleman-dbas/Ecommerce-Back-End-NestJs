import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { User, UserDocument } from '../../user/schemas/user.schema';
import { compare, hash } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import type { ConfigType } from '@nestjs/config';
import { Model } from 'mongoose';
import authConfig from '../../config/auth.config';
import { UserResponseDto } from '../../common/dto/responses/user-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    @Inject(authConfig.KEY)
    private readonly authConfiguration: ConfigType<typeof authConfig>,
  ) {}

  async register(registerAuthDto: RegisterDto): Promise<{ user: UserResponseDto; message: string }> {
    const existingUser = await this.userModel.findOne({
      email: registerAuthDto.email,
    }).lean().exec();

    if (existingUser) {
      throw new ConflictException('Email is already in use! please try with different email');
    }

    const hashedPassword = await this.hashpassword(registerAuthDto.password);
    const newUser = await this.userModel.create({
      email: registerAuthDto.email,
      name: registerAuthDto.name,
      password: hashedPassword,
    });

    const user = UserResponseDto.fromEntity(newUser);

    return {
      user,
      message: 'Registration successfully! please login to continue',
    };
  }

  async createAdmin(registerAuthDto: RegisterDto): Promise<{ user: UserResponseDto; message: string }> {
    const existingUser = await this.userModel.findOne({
      email: registerAuthDto.email,
    }).lean().exec();

    if (existingUser) {
      throw new ConflictException('Email is already in use! please try with different email');
    }

    const hashedPassword = await this.hashpassword(registerAuthDto.password);
    const newUser = await this.userModel.create({
      email: registerAuthDto.email,
      name: registerAuthDto.name,
      password: hashedPassword,
      role: 'admin',
      active: true,
    });
    
    const user = UserResponseDto.fromEntity(newUser);

    return {
      user,
      message: 'Admin user created successfully! please login to continue',
    };
  }

  async login(loginAuthDto: LoginDto): Promise<{ user: UserResponseDto; accessToken: string; refreshToken: string }> {
    const user = await this.userModel.findOne({
      email: loginAuthDto.email,
    }).lean().exec();

    if (!user || !(await this.verifyPassword(loginAuthDto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials or account not exists');
    }

    const tokens = this.generateToken(user);
    const responseUser = UserResponseDto.fromEntity(user);

    return {
      user: responseUser,
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<{ user: UserResponseDto; accessToken: string; refreshToken: string }> {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.authConfiguration.refreshTokenSecret,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid Token');
    }

    const user = await this.userModel.findById(payload.sub).lean().exec();
    if (!user) {
      throw new UnauthorizedException('Invalid Token');
    }

    if (Number(payload.tokenVersion ?? 0) !== Number(user.tokenVersion ?? 0)) {
      throw new UnauthorizedException('Invalid Token');
    }

    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken(user);
    const responseUser = UserResponseDto.fromEntity(user);

    return {
      user: responseUser,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async getUserById(userId: string) {
    const user = await this.userModel.findById(userId).lean().exec();
    if (!user) {
      throw new UnauthorizedException('user not found');
    }

    return {
      id: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
      tokenVersion: user.tokenVersion ?? 0,
    };
  } 

  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.userModel.findById(userId).select('-password -__v').lean().exec();
    if (!user) {
      throw new UnauthorizedException('user not found');
    }

    return UserResponseDto.fromEntity(user);
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { $inc: { tokenVersion: 1 } },
    );
  }

  private async hashpassword(password: string): Promise<string> {
    return hash(password, 10);
  }

  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return compare(password, hashedPassword);
  }

  private generateToken(user: any) {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
    };
  }

  private generateAccessToken(user: any): string {
    const payload = {
      email: user.email,
      sub: user._id.toString(),
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    };

    return this.jwtService.sign(payload, {
      secret: this.authConfiguration.jwtSecret,
      expiresIn: this.authConfiguration.accessTokenExpiresIn,
    });
  }

  private generateRefreshToken(user: any): string {
    const payload = {
      sub: user._id.toString(),
      tokenVersion: user.tokenVersion ?? 0,
    };

    return this.jwtService.sign(payload, {
      secret: this.authConfiguration.refreshTokenSecret,
      expiresIn: this.authConfiguration.refreshTokenExpiresIn,
    });
  }

  async logout(userId: string): Promise<{ message: string }> {
    return { message: 'Logged out successfully' };
  }

}