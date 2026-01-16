import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { Mode } from '../entities/post.entity';

export class CreatePostDto {
  @IsString()
  postBody: string;

  @IsString()
  postHeading: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMinSize(0)
  images: string[];

  @IsEnum(Mode)
  @IsOptional()
  mode: Mode;

  @IsString()
  @IsOptional()
  groupId: string;
}
