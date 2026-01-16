import {
  ArrayMinSize,
  IsArray,
  IsString,
} from 'class-validator';

export class GetSamplesDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(0)
  ids: string[];
}
