import { IsString } from 'class-validator';
import { OptionSearchDto } from 'src/cores/globalDtos/optionsSearch.dto';
import { QueryCommentDto } from './query-comment.dto';
import { QueryReplyDto } from './query-reply.dto';

export class QueryPostDto extends QueryCommentDto {
  @IsString()
  postId: string;
}
