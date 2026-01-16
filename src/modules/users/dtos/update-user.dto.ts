import { Optional } from '@nestjs/common';
import { PartialType } from '@nestjs/mapped-types';
import { IsString } from 'class-validator';
import { CreateUserDto } from 'src/modules/auth/dto/create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  offlineTime: Date | undefined;

  @IsString()
  @Optional()
  description?: string;
}
