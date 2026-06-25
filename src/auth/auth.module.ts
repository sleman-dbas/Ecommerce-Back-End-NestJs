import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategy/jwt.strategy';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/user/user.schema';
import { PasswordResetToken, PasswordResetTokenSchema } from './schemas/password-reset-token.schema';
import { PasswordResetService } from './services/password-reset.service';
import { PasswordResetRateLimitService } from './services/password-reset-rate-limit.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: PasswordResetToken.name, schema: PasswordResetTokenSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PasswordResetService, PasswordResetRateLimitService],
})
export class AuthModule {}
