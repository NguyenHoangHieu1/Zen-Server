import { IsOptional, IsString } from 'class-validator';
import { OptionSearchDto } from 'src/cores/globalDtos/optionsSearch.dto';

export class FindGroupsDto extends OptionSearchDto {
  @IsString()
  userId: string;

  @IsString()
  @IsOptional()
  userIdGroups: string;
}
