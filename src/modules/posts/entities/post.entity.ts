import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { GroupId } from 'src/common/types/Group';
import { CommentId, PostId } from 'src/common/types/Post';
import { UserId } from 'src/common/types/User';
import { User } from 'src/modules/users/entities/User.entity';

export type ReplyType = {
  comment: string;
  user: Pick<User, 'avatar' | 'username' | '_id'>;
  _id: CommentId;
  createdAt: Date;
};

export type CommentType = {
  comment: string;
  user: Pick<User, 'avatar' | 'username' | '_id'>;
  _id: CommentId;
  replies: ReplyType[];
  createdAt: Date;
};

export enum Mode {
  'global',
  'private',
  'normal',
}

@Schema({ timestamps: true })
export class Post {
  _id: PostId;

  @Prop({ type: String, required: true, index: 'text' })
  postBody: string;

  @Prop({ type: String, required: true, index: 'text' })
  postHeading: string;

  @Prop({ type: Number, required: true, default: 0 })
  views: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: UserId;

  user: User;

  @Prop({ type: [String], required: true, default: [] })
  files: string[];

  @Prop({ type: [String], required: true, default: [] })
  images: string[];

  @Prop({ type: [Types.ObjectId], ref: 'User', required: true, default: [] })
  likes: UserId[];
  @Prop({
    type: [
      {
        comment: { type: String, required: true },
        user: {
          type: {
            avatar: String,
            username: String,
            _id: { type: Types.ObjectId, required: true, ref: 'User' },
          },
          required: true,
        },
        replies: {
          type: [
            {
              comment: { type: String, required: true },
              user: {
                type: {
                  avatar: { type: String, required: false },
                  username: { type: String, required: true },
                  _id: { type: Types.ObjectId, required: true, ref: 'User' },
                },
              },
              default: [],
              createdAt: { type: Date, default: Date.now() },
            },
          ],
          required: true,
          default: [],
        },
        createdAt: { type: Date, default: Date.now() },
      },
    ],
    _id: true,
    required: true,
    default: [],
  })
  comments: CommentType[];

  @Prop({ type: String, required: true, enum: Mode, default: 'normal' })
  mode: Mode;

  @Prop({ type: Types.ObjectId, required: false, ref: 'Group' })
  groupId: GroupId;

  createdAt: Date;

  updatedAt: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);
