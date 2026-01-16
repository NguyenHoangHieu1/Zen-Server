import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { UserId } from 'src/common/types/User';
import { ConversationId } from 'src/common/types/conversation';

@Schema({ timestamps: true })
export class ConversationGroups {
  _id: ConversationId;

  @Prop({ required: true, type: String })
  conversationTitle: string;

  @Prop({ required: true, type: String, default: '' })
  conversationAvatar: string;

  @Prop({ required: true, ref: 'User', type: [Types.ObjectId] })
  userIds: UserId[];

  @Prop({
    required: true,
    type: [
      {
        userId: {
          required: true,
          type: Types.ObjectId,
          ref: 'User',
        },
        message: {
          required: true,
          type: String,
        },
        date: {
          type: Date,
          required: true,
          default: new Date(),
        },
      },
    ],
  })
  messages: [];
}

export const ConversationGroupsSchema =
  SchemaFactory.createForClass(ConversationGroups);
