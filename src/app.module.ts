import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import authConfig from './config/auth.config';
import mailConfig from './config/mail.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig, mailConfig],
    }),
    MongooseModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (databaseConfiguration: ConfigType<typeof databaseConfig>) => ({
        uri: databaseConfiguration.uri,
      }),
    }),
    AuthModule,
    UserModule,
    JwtModule.registerAsync({
      global: true,
      inject: [authConfig.KEY],
      useFactory: (authConfiguration: ConfigType<typeof authConfig>) => ({
        secret: authConfiguration.jwtSecret,
        signOptions: {
          expiresIn: authConfiguration.authModuleTokenExpiresIn,
        },
      }),
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
