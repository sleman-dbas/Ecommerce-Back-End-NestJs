import { IsEmail, IsString, Matches } from 'class-validator';

export class VerifyResetCodeDto {
  @IsEmail({}, { message: 'Email is invalid' })
  email: string;

  @IsString({ message: 'Reset code must be a string' })
  @Matches(/^\d{6}$/, { message: 'Reset code must be 6 digits' })
  code: string;
}