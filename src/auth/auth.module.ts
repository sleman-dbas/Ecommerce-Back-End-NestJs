import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { JwtStrategy } from './strategy/jwt.strategy';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/schemas/user.schema';
import { PasswordResetToken, PasswordResetTokenSchema } from './schemas/password-reset-token.schema';
import { PasswordResetService } from './services/password-reset.service';
import { PasswordResetRateLimitService } from './services/password-reset-rate-limit.service';
import authConfig from '../config/auth.config';
import mailConfig from '../config/mail.config';

@Module({
  imports: [
    ConfigModule.forFeature(authConfig),
    ConfigModule.forFeature(mailConfig),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: PasswordResetToken.name, schema: PasswordResetTokenSchema },
    ]),
    JwtModule.registerAsync({
      inject: [authConfig.KEY],
      useFactory: (authConfiguration: ConfigType<typeof authConfig>) => ({
        secret: authConfiguration.jwtSecret,
        signOptions: {
          expiresIn: authConfiguration.authModuleTokenExpiresIn,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PasswordResetService, PasswordResetRateLimitService],
})
export class AuthModule {}
