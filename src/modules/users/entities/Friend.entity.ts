import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { UserId } from 'src/common/types/User';

@Schema()
export class Friend {
  _id: UserId;

  @Prop({ ref: 'User', required: true, default: [], type: Types.ObjectId })
  userId: UserId;

  @Prop({ ref: 'User', required: true, default: [], type: [Types.ObjectId] })
  friends: UserId[];

  @Prop({ ref: 'User', required: true, default: [], type: [Types.ObjectId] })
  wait: UserId[];

  @Prop({ ref: 'User', required: true, default: [], type: [Types.ObjectId] })
  await: UserId[];

  @Prop({ ref: 'User', required: true, default: [], type: [Types.ObjectId] })
  notInterested: UserId[];

  @Prop({ type: [Types.ObjectId], required: true, default: [] })
  followers: UserId[];

  @Prop({ type: [Types.ObjectId], required: true, default: [] })
  followings: UserId[];
}
export const FriendSchema = SchemaFactory.createForClass(Friend);
