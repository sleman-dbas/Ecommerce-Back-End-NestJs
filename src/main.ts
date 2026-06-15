import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { MongoExceptionFilter } from './common/filters/mongo-exception.filter';
import { MongooseValidationFilter } from './common/filters/mongoose-validation.filter';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
    new MongooseValidationFilter()
  );


  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
