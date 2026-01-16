import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OptionSearchDto } from 'src/cores/globalDtos/optionsSearch.dto';
import { convertToMongoId } from 'src/common/utils/ConvertToMongoId';

enum findUsersEnum {
  'not-interested',
  'has-sent-request',
  'normal-user',
}

type findUsersType = 'not-interested' | 'has-sent-request' | 'normal-user';

export class FindUsersDto extends OptionSearchDto {
  @IsString()
  @IsOptional()
  username: string;

  @IsString()
  @IsOptional()
  userId: string;

  @IsString()
  @IsOptional()
  @Transform((data) => {
    return data.value ? data.value : '';
  })
  usersType: findUsersType;
}
