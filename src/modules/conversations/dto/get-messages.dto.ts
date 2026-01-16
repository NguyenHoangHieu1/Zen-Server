import { IsString } from 'class-validator';
import { OptionSearchDto } from 'src/cores/globalDtos/optionsSearch.dto';
import { UserId } from 'src/common/types/User';

export class GetMessagesDto extends OptionSearchDto {
  @IsString()
  conversationId: string;
}
