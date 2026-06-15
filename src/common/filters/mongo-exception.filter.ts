import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { MongoError } from 'mongodb';

@Catch(MongoError)
export class MongoExceptionFilter implements ExceptionFilter {
  catch(exception: MongoError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let message = 'Database error';

    if (exception.code === 11000) {
      message = 'Duplicate key error (email already exists)';
    }

    return response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: 400,
      message,
      error: 'Bad Request',
    });
  }
}
