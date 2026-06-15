import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Error as MongooseError } from 'mongoose';

@Catch(MongooseError.ValidationError)
export class MongooseValidationFilter implements ExceptionFilter {
  catch(exception: MongooseError.ValidationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const errors = Object.values(exception.errors).map((err: any) => err.message);

    return response.status(HttpStatus.BAD_REQUEST).json({
     statusCode: 400,
      message: "Invalid input data",
     error: "Validation Error",
    });

  }
}
