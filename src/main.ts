import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { MongoExceptionFilter } from './common/filters/mongo-exception.filter';
import { AllExceptionFilter } from './common/filters/all-exception.filter';
import { MongooseValidationFilter } from './common/filters/mongoose-validation.filter';
import cookieParser from 'cookie-parser';
import appConfig from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appConfiguration = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);
  app.use(cookieParser());

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.useGlobalFilters(
    new MongoExceptionFilter(),
    new MongooseValidationFilter(),
    new AllExceptionFilter(),
  );

  await app.listen(appConfiguration.port);
}
bootstrap();
