import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { UserId } from 'src/common/types/User';
import { ConversationId, MessageId } from 'src/common/types/conversation';

export type Message = {
  message: string;
  date: Date;
  userId: UserId;
  _id: MessageId;
  messageHidden: UserId[];
};

@Schema({ timestamps: true })
export class Conversation {
  _id: ConversationId;

  @Prop({ required: true, ref: 'User', type: [Types.ObjectId] })
  userIds: [UserId];

  @Prop({
    required: true,
    type: [
      {
        message: {
          required: true,
          type: String,
        },
        date: {
          type: Date,
          required: true,
          default: new Date(),
        },
        userId: {
          type: Types.ObjectId,
          required: true,
          ref: 'User',
        },
        messageHidden: {
          type: [Types.ObjectId],
          required: false,
          ref: 'User',
        },
      },
    ],
  })
  messages: Message[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  notificationForWho: UserId;
}

export const conversationSchema = SchemaFactory.createForClass(Conversation);
