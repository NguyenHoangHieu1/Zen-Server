import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { GroupId } from 'src/common/types/Group';
import { PostId } from 'src/common/types/Post';
import { UserId } from 'src/common/types/User';

@Schema()
export class Group {
  _id: GroupId;

  @Prop({ type: String, required: true, index: 'text' })
  groupName: string;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: UserId;

  @Prop({ type: String, required: true, index: 'text' })
  groupDescription: string;

  @Prop({ type: String, required: true })
  groupAvatar: string;

  @Prop({ type: [Types.ObjectId], required: true, ref: 'Post', default: [] })
  postIds: PostId[];

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [], required: true })
  userIds: UserId[];

  @Prop({ type: Boolean, required: true, default: true })
  isPrivate: boolean;
}

export const groupSchema = SchemaFactory.createForClass(Group);
