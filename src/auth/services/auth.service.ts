import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { User, UserDocument } from '../../user/user.schema';
import { compare, hash } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import type { ConfigType } from '@nestjs/config';
import { Model } from 'mongoose';
import authConfig from 'src/config/auth.config';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    @Inject(authConfig.KEY)
    private readonly authConfiguration: ConfigType<typeof authConfig>,
  ) {}

  async register(registerAuthDto: RegisterDto) {
    const existingUser = await this.userModel.findOne({
      email: registerAuthDto.email,
    });

    if (existingUser) {
      throw new ConflictException('Email is already in use! please try with different email');
    }

    const hashedPassword = await this.hashpassword(registerAuthDto.password);
    const newUser = await this.userModel.create({
      email: registerAuthDto.email,
      name: registerAuthDto.name,
      password: hashedPassword,
    });

    const { password, ...result } = newUser.toObject(); 

    return {
      user: result,
      message: 'Registration successfully! please login to continue',
    };
  }

  async createAdmin(registerAuthDto: RegisterDto) {
    const existingUser = await this.userModel.findOne({
      email: registerAuthDto.email,
    });

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
    
    const { password, ...result } = newUser.toObject();

    return {
      user: result,
      message: 'Admin user created successfully! please login to continue',
    };
  }

  async login(loginAuthDto: LoginDto) {
    const user = await this.userModel.findOne({
      email: loginAuthDto.email,
    });

    if (!user || !(await this.verifyPassword(loginAuthDto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials or account not exists');
    }

    const tokens = this.generateToken(user);
    const { password, ...result } = user.toObject();

    return {
      user: result,
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.authConfiguration.refreshTokenSecret,
      });

      const user = await this.userModel.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Invalid Token');
      }

      if (Number(payload.tokenVersion ?? 0) !== Number(user.tokenVersion ?? 0)) {
        throw new UnauthorizedException('Invalid Token');
      }

      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid Token');
    }
  }

  async getUserById(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('user not found');
    }

    // استبعاد password وإرجاع id بصيغة نصية
    const { password, ...userData } = user.toObject();
    return {
      id: userData._id.toString(),   // تحويل ObjectId إلى string
      role: userData.role,
      name: userData.name,
      email: userData.email,
      tokenVersion: userData.tokenVersion ?? 0,
    };
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

  private generateToken(user: UserDocument) {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
    };
  }

  private generateAccessToken(user: UserDocument): string {
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

  private generateRefreshToken(user: UserDocument): string {
    const payload = {
      sub: user._id.toString(),
      tokenVersion: user.tokenVersion ?? 0,
    };

    return this.jwtService.sign(payload, {
      secret: this.authConfiguration.refreshTokenSecret,
      expiresIn: this.authConfiguration.refreshTokenExpiresIn,
    });
  }

  async logout(userId: string) {
  return { message: 'Logged out successfully' };
  }
  
}