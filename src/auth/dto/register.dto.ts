import { IsEmail, IsOptional, IsString, MinLength, MaxLength, IsIn, IsNotEmpty } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(30)
  "name": string;

  @IsEmail()
  @IsNotEmpty()
  "email": string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(20)
  "password": string;

}
