import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { MongoExceptionFilter } from './common/filters/mongo-exception.filter';
import { AllExceptionFilter } from './common/filters/all-exception.filter';
import { MongooseValidationFilter } from './common/filters/mongoose-validation.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import appConfig from './config/app.config';
import { ResponseWrapInterceptor } from './common/interceptors/response-wrap.interceptor';

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

  app.useGlobalInterceptors(new ResponseWrapInterceptor());

  app.useGlobalFilters(
    new MongoExceptionFilter(),
    new MongooseValidationFilter(),
    new AllExceptionFilter(),
  );

  const config = new DocumentBuilder()
  .setTitle('E-Commerce API')
  .setDescription('API documentation for the E-Commerce Platform (Categories, Products, Orders, etc.)')
  .setVersion('1.0')
  .build();

  const document = SwaggerModule.createDocument(app, config);

  const options = {
    swaggerOptions: {
      withCredentials: true, 
    },
  };
  SwaggerModule.setup('api/docs', app, document, options);

  await app.listen(appConfiguration.port);
}
bootstrap();
