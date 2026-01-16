import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';

export class JoinConversationDto {
  @IsString()
  userId: string;

  @IsString()
  conversationId: string;
}
