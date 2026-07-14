import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { ApiResponseDto } from '../dto/responses/api-response.dto';

@Injectable()
export class ResponseWrapInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponseDto> {
    const statusCode = context.switchToHttp().getResponse()?.statusCode ?? 200;

    return next.handle().pipe(map((value) => this.wrap(value, statusCode)));
  }

  private wrap(value: unknown, statusCode: number): ApiResponseDto {
    if (Array.isArray(value)) {
      return {
        success: true,
        statusCode,
        data: value,
      };
    }

    if (!value || typeof value !== 'object') {
      return {
        success: true,
        statusCode,
        data: value,
      };
    }

    const response = value as Record<string, unknown>;

    if (
      'success' in response &&
      ('data' in response || 'message' in response || 'meta' in response)
    ) {
      return {
        statusCode,
        ...(response as Record<string, unknown>),
      } as ApiResponseDto;
    }

    const { status, message, data, length, total, page, lastPage, ...rest } = response;
    const meta: Record<string, unknown> = {};

    if (length !== undefined) meta.length = length;
    if (total !== undefined) meta.total = total;
    if (page !== undefined) meta.page = page;
    if (lastPage !== undefined) meta.lastPage = lastPage;

    const payload = data !== undefined && data !== null
      ? data
      : Object.keys(rest).length > 0
        ? rest
        : undefined;

    return {
      success: typeof status === 'number' ? status < 400 : true,
      statusCode: typeof status === 'number' ? status : statusCode,
      ...(typeof message === 'string' ? { message } : {}),
      ...(payload !== undefined ? { data: payload } : {}),
      ...(Object.keys(meta).length > 0 ? { meta } : {}),
    };
  }
}