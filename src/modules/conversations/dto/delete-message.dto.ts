import { IsString } from 'class-validator';

export class DeleteMessageDto {
  @IsString()
  messageId: string;

  @IsString()
  conversationId: string;

  @IsString()
  deleteForWho: 'you' | 'everyone';
}
