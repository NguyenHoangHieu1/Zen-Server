import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { GroupId } from 'src/common/types/Group';
import { CommentId, PostId } from 'src/common/types/Post';
import { UserId } from 'src/common/types/User';
export type reportType = 'violence' | 'NSFW' | 'false-information';

export type ReportOptions = {
  postId?: PostId;
  groupId?: GroupId;
  commentId?: CommentId;
};

@Schema({ timestamps: true })
export class Report {
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, default: 'PENDING' })
  status: 'FINISH' | 'PENDING' | 'IGNORE';

  @Prop({ type: String, required: true })
  reportType: reportType;

  @Prop({ type: String, required: true })
  reportTitle: string;

  @Prop({ type: String, required: true })
  reportBody: string;

  @Prop({ type: Types.ObjectId, required: true })
  userIdReport: UserId;

  @Prop({ type: Types.ObjectId, required: true })
  userIdReported: UserId;
  createdAt: Date;

  @Prop({
    type: {
      postId: {
        type: Types.ObjectId,
        required: false,
        ref: 'Post',
      },
      commentId: {
        type: Types.ObjectId,
        required: false,
      },
      groupId: {
        type: Types.ObjectId,
        required: false,
        ref: 'Group',
      },
    },
  })
  options: ReportOptions;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
