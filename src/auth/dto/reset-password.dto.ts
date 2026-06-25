import { IsString, MinLength, MaxLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: 'Reset code must be a string' })
  resetToken: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(20, { message: 'Password must not exceed 20 characters' })
  newPassword: string;

  @IsString({ message: 'Confirm password must be a string' })
  confirmPassword: string;
}