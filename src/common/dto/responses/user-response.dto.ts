import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, plainToInstance } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  @ApiProperty({ example: '66b6f0d6f0d6f0d6f0d6f0d6' })
  @Transform(({ obj }) => obj._id?.toString() || obj.id?.toString())
  id!: string;

  @Expose()
  @ApiProperty({ example: 'John Doe' })
  name!: string;

  @Expose()
  @ApiProperty({ example: 'john@example.com' })
  email!: string;

  @Expose()
  @ApiProperty({ example: 'customer' })
  role!: string;

  @Expose()
  @ApiProperty({ example: 'https://example.com/avatar.png', required: false })
  avatar?: string;

  @Expose()
  @ApiProperty({ example: 28, required: false })
  age?: number;

  @Expose()
  @ApiProperty({ example: '0931234567', required: false })
  phone?: string;

  @Expose()
  @ApiProperty({ example: 'Damascus, Syria', required: false })
  address?: string;

  @Expose()
  @ApiProperty({ example: true })
  active!: boolean;

  @Expose()
  @ApiProperty({ example: 'male', required: false })
  gender?: string;

  @Expose()
  @ApiProperty({ example: '2026-07-13T10:00:00.000Z' })
  createdAt!: Date;

  @Expose()
  @ApiProperty({ example: '2026-07-13T10:00:00.000Z' })
  updatedAt!: Date;

  static fromEntity(entity: any[]): UserResponseDto[];
  static fromEntity(entity: any): UserResponseDto;
  static fromEntity(entity: any): UserResponseDto | UserResponseDto[] {
    return plainToInstance(UserResponseDto, entity, {
      excludeExtraneousValues: true,
    });
  }
}