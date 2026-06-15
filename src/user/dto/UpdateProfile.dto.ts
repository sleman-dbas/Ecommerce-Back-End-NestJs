import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  MinLength,
  MaxLength,
  Matches,
  Min,
  Max,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  "name"?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(093|094|095|096|099)\d{7}$/)
  "phone"?: string;

  @IsOptional()
  @IsString()
  "address"?: string;

  @IsOptional()
  @IsEnum(['male', 'female'])
  "gender"?: string;

  @IsOptional()
  @IsNumber()
  @Min(18)
  @Max(120)
  "age"?: number;
}