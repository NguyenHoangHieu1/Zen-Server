import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { GroupId } from 'src/common/types/Group';
import { UserId } from 'src/common/types/User';

@Schema()
export class GroupsJoined {
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: UserId;

  @Prop({ required: true, type: [Types.ObjectId], ref: 'Group', default: [] })
  groupIds: GroupId[];
}

export const GroupsJoinedSchema = SchemaFactory.createForClass(GroupsJoined);
