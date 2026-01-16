import {
  IsBoolean,
  IsBooleanString,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';
export class CreateGroupDto {
  @IsString()
  @MinLength(5)
  groupName: string;
  @IsString()
  @MinLength(50)
  groupDescription: string;

  @IsString()
  isPrivate: string;
}
