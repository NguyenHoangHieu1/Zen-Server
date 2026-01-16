import { PartialType } from '@nestjs/mapped-types';
import { CreateConversationGroupDto } from './create-conversation-group.dto';

export class UpdateConversationGroupDto extends PartialType(CreateConversationGroupDto) {
  id: number;
}
