import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { GroupId } from 'src/common/types/Group';

export class CreateGroupPostDto {
  @IsString()
  postBody: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMinSize(0)
  images: string[];

  @IsString()
  groupId: GroupId;
}
