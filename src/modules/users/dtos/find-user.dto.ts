import { IsString } from 'class-validator';
import { OptionSearchDto } from 'src/cores/globalDtos/optionsSearch.dto';

export class FindUserDto extends OptionSearchDto {
  @IsString()
  userId: string;
}
