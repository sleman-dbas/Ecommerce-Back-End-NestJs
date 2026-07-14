import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiResponseDto<T = unknown> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 200 })
  statusCode: number; 
 
  @ApiPropertyOptional({ example: 'Request completed successfully' })
  message?: string;

  @ApiPropertyOptional()
  data?: T;

  @ApiPropertyOptional({
    type: Object,
    additionalProperties: true,
    description: 'Optional pagination or extra metadata',
  })
  meta?: Record<string, unknown>;
}