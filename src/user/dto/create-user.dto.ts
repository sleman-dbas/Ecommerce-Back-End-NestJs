import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsNumber,
  MinLength,
  MaxLength,
  Matches,
  IsBoolean,
} from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'Name must be a string' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @MaxLength(30, { message: 'Name must not exceed 30 characters' })
  "name": string;

  @IsEmail({}, { message: 'Email is invalid' })
  @Matches(/^\S+@\S+\.\S+$/, { message: 'Email must be in a valid format' })
  "email": string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(3, { message: 'Password must be at least 3 characters long' })
  @MaxLength(20, { message: 'Password must not exceed 20 characters' })
  "password": string;

  @IsEnum(['customer', 'admin'], { message: 'Role must be either customer or admin' })
  "role": string;

  @IsOptional()
  @IsString({ message: 'Avatar URL must be a string' })
  "avatar"?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Age must be a number' })
  "age"?: number;

  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  @Matches(/^(093|094|095|096|099)\d{7}$/, {
    message: 'Phone number must be a valid Syrian mobile number (10 digits, starting with 093, 094, 095, 096, or 099)',
  })
  "phone"?: string;

  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  "address"?: string;

  @IsOptional()
  @IsBoolean({ message: 'Active field must be a boolean (true/false)' })
  "active"?: boolean;

  @IsOptional()
  @IsString({ message: 'Verification code must be a string' })
  "verificationCode"?: string;

  @IsOptional()
  @IsEnum(['male', 'female'], { message: 'Gender must be either male or female' })
  "gender"?: string;
}