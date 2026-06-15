import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User, UserDocument } from '../user/user.schema';
import { compare, hash } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
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
      role: registerAuthDto.role ?? 'customer',
    });

    const { password, ...result } = newUser.toObject(); // تحويل إلى كائن عادي لاستبعاد كلمة المرور

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
        secret: 'refresh_secret', // يفضل نقله إلى ConfigService
      });

      const user = await this.userModel.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Invalid Token');
      }

      // توليد توكنات جديدة (rotation)
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      // (اختياري) يمكنك حفظ refreshToken الجديد في قاعدة البيانات وإبطال القديم

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
    };
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
      refreshToken: this.generateRefreshToken(user), // كان generateRefershToken
    };
  }

  private generateAccessToken(user: UserDocument): string {
    const payload = {
      email: user.email,
      sub: user._id.toString(), // استخدام _id وتحويله إلى نص
      role: user.role,
    };

    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET, // يفضل وضعها في ConfigService
      expiresIn: '15m',
    });
  }

  private generateRefreshToken(user: UserDocument): string {
    const payload = {
      sub: user._id.toString(),
    };

    return this.jwtService.sign(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET,
      expiresIn: '7d',
    });
  }

  async logout(userId: string) {
  return { message: 'Logged out successfully' };
  }
  
}