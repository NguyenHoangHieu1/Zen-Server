import {
  ArrayMinSize,
  IsAlpha,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';
import { OptionSearchDto } from 'src/cores/globalDtos/optionsSearch.dto';
import { UserId } from 'src/common/types/User';

export class FindPostsThroughQueryByDto extends OptionSearchDto {
  @IsString()
  @IsOptional()
  userId: string | UserId;

  @IsString()
  @IsOptional()
  searchInput: string;

  @IsString()
  @IsOptional()
  groupId: string;
}

export class findThroughIds {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMinSize(0)
  ids: string[];
}

// {a:1,b:2,c:3,d:4} =>update the skip number to increase 1 by 1
