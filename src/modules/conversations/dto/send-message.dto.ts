import { IsString, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  message: string;

  @IsString()
  userId: string;

  @IsString()
  conversationId: string;

  @IsString()
  receiverId: string;
}
