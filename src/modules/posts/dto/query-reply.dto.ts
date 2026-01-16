import { IsOptional, IsString } from 'class-validator';

export class QueryReplyDto {
  @IsString()
  @IsOptional()
  replyId: string;
}
