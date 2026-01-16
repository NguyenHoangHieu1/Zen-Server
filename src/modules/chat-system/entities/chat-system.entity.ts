import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { UserId } from 'src/common/types/User';
import { chatSystemId } from 'src/common/types/chat-system';
import { ConversationId } from 'src/common/types/conversation';

@Schema({ timestamps: true })
export class ChatSystem {
  _id: chatSystemId;

  @Prop({ required: true, ref: 'User', type: Types.ObjectId })
  userId: UserId;

  @Prop({
    required: true,
    type: [
      {
        conversationId: {
          type: Types.ObjectId,
          required: true,
          ref: 'Conversation',
        },
        userId: { type: Types.ObjectId, required: true, ref: 'User' },
        _id: false,
      },
    ],
    default: [],
  })
  conversations: [
    {
      conversationId: ConversationId;
      userId: UserId;
    },
  ];
}

export const ChatSystemSchema = SchemaFactory.createForClass(ChatSystem);

// ChatSystemSchema.virtual('populatedUser').get(async function () {
//   const chatSystem = await this.populate({
//     path: 'conversations',
//     populate: { path: 'friendId' },
//   });
// });
