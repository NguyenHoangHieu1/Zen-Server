import {
  isString,
  IsEmail,
  IsStrongPassword,
  Min,
  Max,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';

export enum Gender {
  'male',
  'female',
}
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsStrongPassword()
  password: string;

  @IsString()
  @MinLength(5)
  username: string;

  @IsEnum(Gender)
  gender: string;
}
