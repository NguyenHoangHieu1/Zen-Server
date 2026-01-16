import { IsEmail, IsEnum, IsString, IsStrongPassword } from 'class-validator';
import { Gender } from './create-user.dto';

export class ValidateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  username: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsStrongPassword()
  password: string;
}
