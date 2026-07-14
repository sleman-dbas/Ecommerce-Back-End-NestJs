import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import type { ConfigType } from '@nestjs/config';
import { Model } from 'mongoose';
import { randomInt } from 'crypto';
import { hash, compare } from 'bcrypt';
import nodemailer from 'nodemailer';
import { User, UserDocument } from '../../user/user.schema';
import {
  PasswordResetToken,
  PasswordResetTokenDocument,
} from '../schemas/password-reset-token.schema';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { VerifyResetCodeDto } from '../dto/verify-reset-code.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { PasswordResetRateLimitService } from './password-reset-rate-limit.service';
import { AuthService } from './auth.service';
import authConfig from '../../config/auth.config';
import mailConfig from '../../config/mail.config';

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(PasswordResetToken.name)
    private readonly passwordResetTokenModel: Model<PasswordResetTokenDocument>,
    private readonly jwtService: JwtService,
    private readonly rateLimitService: PasswordResetRateLimitService,
    private readonly authService: AuthService,
    @Inject(authConfig.KEY)
    private readonly authConfiguration: ConfigType<typeof authConfig>,
    @Inject(mailConfig.KEY)
    private readonly mailConfiguration: ConfigType<typeof mailConfig>,
  ) {}

  async forgotPassword(dto: ForgotPasswordDto, ip: string) {
    const email = this.normalizeEmail(dto.email);
    this.rateLimitService.enforce(email, ip);

    const user = await this.userModel.findOne({ email }).lean().exec();
    if (!user) {
      return { message: 'If this email exists, a reset code has been sent' };
    }
    // Mark all previous unused tokens for this email as used
    await this.passwordResetTokenModel.updateMany(
      { email, isUsed: false },
      { $set: { isUsed: true, usedAt: new Date() } },
    );

    const otp = this.generateOtp();
    const otpHash = await hash(otp, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.passwordResetTokenModel.create({
      email,
      otpHash,
      expiresAt,
      isVerified: false,
      isUsed: false,
      attempts: 0,
      requestIp: ip,
    });

    await this.sendResetEmail(email, otp);

    return { message: 'If this email exists, a reset code has been sent' };
  }

  async verifyResetCode(dto: VerifyResetCodeDto, ip: string) {
    const email = this.normalizeEmail(dto.email);
    this.rateLimitService.enforce(email, ip);

    const record = await this.passwordResetTokenModel
      .findOne({ email, isUsed: false })
      .sort({ createdAt: -1 })
      .exec();

    if (!record || record.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    if (record.attempts >= 5) {
      throw new HttpException(
        'Too many invalid attempts. Request a new reset code.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const matches = await compare(dto.code, record.otpHash);
    if (!matches) {
      record.attempts += 1;
      await record.save();
      if (record.attempts >= 5) {
        record.isUsed = true;
        record.usedAt = new Date();
        await record.save();
        throw new HttpException(
          'Too many invalid attempts. Request a new reset code.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw new BadRequestException('Invalid or expired reset code');
    }

    record.isVerified = true;
    record.verifiedAt = new Date();
    await record.save();

    const user = await this.userModel.findOne({ email }).lean().exec();
    if (!user) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const resetToken = this.jwtService.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        tokenVersion: user.tokenVersion ?? 0,
        purpose: 'password-reset',
        resetId: record._id.toString(),
      },
      {
        secret: this.authConfiguration.resetPasswordJwtSecret,
        expiresIn: this.authConfiguration.accessTokenExpiresIn,
      },
    );

    return {
      message: 'Reset code verified successfully',
      resetToken,
    };
  }

  async resetPassword(dto: ResetPasswordDto, ip: string) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    let payload: any;
    try {
      payload = this.jwtService.verify(dto.resetToken, {
        secret: this.authConfiguration.resetPasswordJwtSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired reset session');
    }

    if (payload?.purpose !== 'password-reset') {
      throw new UnauthorizedException('Invalid or expired reset session');
    }

    const email = this.normalizeEmail(payload.email);
    this.rateLimitService.enforce(email, ip);

    const record = await this.passwordResetTokenModel.findById(payload.resetId).exec();
    if (
      !record ||
      record.isUsed ||
      !record.isVerified ||
      record.expiresAt.getTime() <= Date.now() ||
      this.normalizeEmail(record.email) !== email
    ) {
      throw new UnauthorizedException('Invalid or expired reset session');
    }

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset session');
    }

    user.password = await hash(dto.newPassword, 10);
    await user.save();

    await this.authService.revokeAllUserSessions(user._id.toString());

    await this.passwordResetTokenModel.deleteOne({ _id: record._id });

    return { message: 'Password has been reset successfully' };
  }

  private generateOtp(): string {
    return String(randomInt(100000, 1000000));
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async sendResetEmail(email: string, otp: string) {
    const gmailUser = this.mailConfiguration.gmailUser;
    const gmailAppPassword = this.mailConfiguration.gmailAppPassword;
    const fromName = this.mailConfiguration.fromName;
    
    if (!gmailUser || !gmailAppPassword) {
      throw new Error(
        'Gmail is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in the environment.',
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    await transporter.sendMail({
      from: `${fromName} <${gmailUser}>`,
      to: email,
      subject: 'Your password reset code',
      text: `Your password reset code is: ${otp}\nThis code expires in 15 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2>Password reset code</h2>
          <p>Your password reset code is:</p>
          <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 16px 0;">${otp}</div>
          <p>This code expires in 15 minutes.</p>
        </div>
      `,
    });
  }
}