import { IsOptional, IsString } from 'class-validator';
import { QueryReplyDto } from './query-reply.dto';

export class QueryCommentDto extends QueryReplyDto {
  @IsString()
  @IsOptional()
  commentId: string;
}
