// change-password.dto.ts
import { IsString, MinLength, IsNotEmpty } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  "oldPassword": string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  "newPassword": string;
}