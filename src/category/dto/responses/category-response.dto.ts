import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type, plainToInstance } from 'class-transformer';

export class CategoryResponseDto {
  @Expose()
  @ApiProperty({ example: '66b6f0d6f0d6f0d6f0d6f0d6' })
  @Transform(({ obj }) => obj._id?.toString() || obj.id?.toString())
  id!: string;

  @Expose()
  @ApiProperty({ example: 'Electronics' })
  name!: string;

  @Expose()
  @ApiProperty({ example: 'electronics' })
  slug!: string;

  @Expose()
  @ApiProperty({ example: 'Phones, laptops, and accessories', required: false })
  description?: string;

  @Expose()
  @ApiProperty({ example: '66b6f0d6f0d6f0d6f0d6f0d5', required: false, nullable: true })
  @Transform(({ value }) => (value ? value.toString() : null))
  parent_id?: string | null;

  @Expose()
  @ApiProperty({ example: 'https://example.com/image.png', required: false })
  image?: string;

  @Expose()
  @ApiProperty({ example: 1 })
  sort_order!: number;

  @Expose()
  @ApiProperty({ example: true })
  is_active!: boolean;

  @Expose()
  @ApiProperty({ example: '2026-07-13T10:00:00.000Z' })
  createdAt!: Date;

  @Expose()
  @ApiProperty({ example: '2026-07-13T10:00:00.000Z' })
  updatedAt!: Date;

  @Expose()
  @ApiProperty({ type: () => CategoryResponseDto, required: false, isArray: true })
  @Type(() => CategoryResponseDto)
  children?: CategoryResponseDto[];

  static fromEntity(entity: any[]): CategoryResponseDto[];
  static fromEntity(entity: any): CategoryResponseDto;
  static fromEntity(entity: any): CategoryResponseDto | CategoryResponseDto[] {
    return plainToInstance(CategoryResponseDto, entity, {
      excludeExtraneousValues: true,
    });
  }
}