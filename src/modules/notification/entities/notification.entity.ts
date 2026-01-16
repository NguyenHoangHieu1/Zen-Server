import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { GroupId } from 'src/common/types/Group';
import { NotificationId } from 'src/common/types/Notification';
import { PostId } from 'src/common/types/Post';
import { UserId } from 'src/common/types/User';

export type NotificationType =
  | 'general'
  | 'friend-request'
  | 'accept-friend'
  | 'post-comment'
  | 'warning'
  | 'restrict'
  | 'ban';

export type NotificationOptions = {
  link?: string;
  userId?: UserId;
  postId?: PostId;
  groupId?: GroupId;
};

@Schema({ timestamps: true })
export class Notification {
  _id: NotificationId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: UserId;

  @Prop({ type: String, required: true, default: 'general' })
  notificationType: NotificationType;

  @Prop({
    type: {
      link: {
        type: String,
        required: false,
      },
      userId: {
        type: Types.ObjectId,
        required: false,
        ref: 'User',
      },
      postId: {
        type: Types.ObjectId,
        required: false,
        ref: 'Post',
      },
      groupId: {
        type: Types.ObjectId,
        required: false,
        ref: 'Group',
      },
      _id: false,
    },
  })
  options: NotificationOptions;

  @Prop({ type: String, required: true, default: '' })
  notificationHeader: string;

  @Prop({ type: String, required: true, default: '' })
  notificationBody: string;

  @Prop({ type: Boolean, required: true, default: false })
  hasSeen: boolean;

  @Prop({ type: Date, required: true, default: new Date() })
  createdAt: Date;

  @Prop({ type: Date, required: true })
  expiresAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
