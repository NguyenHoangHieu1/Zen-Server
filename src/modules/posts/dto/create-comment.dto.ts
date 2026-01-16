import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { GroupId } from 'src/common/types/Group';
import { CommentId, PostId } from 'src/common/types/Post';
import { convertToMongoId } from 'src/common/utils/ConvertToMongoId';
export class CreateCommentDto {
  @IsString()
  postId: string;
  @IsString()
  comment: string;
  @IsString()
  @IsOptional()
  commentId: string;

  @IsString()
  @IsOptional()
  groupId: string;
}
