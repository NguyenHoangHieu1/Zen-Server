import { IsEmail, IsString, IsStrongPassword } from 'class-validator';
export class ChangePasswordDto {
  @IsStrongPassword()
  oldPassword: string;

  @IsStrongPassword()
  newPassword: string;
}
