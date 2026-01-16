import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Conversation } from './entities/conversation.entity';
import { Model, Types } from 'mongoose';
import { UserId } from 'src/common/types/User';
import { SendMessageDto } from './dto/send-message.dto';
import { ConversationId } from 'src/common/types/conversation';
import { GetMessagesDto } from './dto/get-messages.dto';
import { LIMIT_AND_SKIP_MESSAGES } from './conversation.constans';
import { convertToMongoId } from 'src/common/utils/ConvertToMongoId';
import { DeleteMessageDto } from './dto/delete-message.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/User.entity';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<Conversation>,

    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async deleteMessage(userId: UserId, deleteMessageDto: DeleteMessageDto) {
    // const user = await this.userModel.findById(userId);
    const conversation = await this.conversationModel.findById(
      deleteMessageDto.conversationId,
    );
    let messageIndex = 0;
    const message = conversation.messages.find((message, index) => {
      messageIndex = index;
      return message._id.equals(deleteMessageDto.messageId);
    });
    if (
      message.userId.equals(userId) &&
      deleteMessageDto.deleteForWho === 'everyone'
    ) {
      message.messageHidden.push(...conversation.userIds);
      const userids = new Set(message.messageHidden);
      message.messageHidden = [...userids];
    } else if (deleteMessageDto.deleteForWho === 'you') {
      message.messageHidden.push(userId);
    }
    conversation.messages[messageIndex] = message;
    await conversation.save();
    return message;
  }

  async getAllConversationIds(userId: UserId) {
    return this.conversationModel.find(
      { userIds: userId },
      { _id: 1, notificationForWho: 1 },
    );
  }

  async ChangeNotificationToWho(
    conversationId: ConversationId,
    userId: UserId,
  ) {
    return this.conversationModel.findByIdAndUpdate(conversationId, {
      $set: { notificationForWho: userId },
    });
  }

  async getConversations(userId: UserId) {
    return this.conversationModel.find(
      { userIds: userId },
      {},
      {
        populate: {
          path: 'userIds',
          select: '_id email username avatar',
        },
      },
    );
  }

  async getMessages(getMessagesDto: GetMessagesDto, userId: UserId) {
    const conversation = await this.conversationModel.findOne(
      { _id: getMessagesDto.conversationId, userIds: userId },
      {
        messages: {
          $slice: [
            getMessagesDto.skip || LIMIT_AND_SKIP_MESSAGES,
            getMessagesDto.limit || LIMIT_AND_SKIP_MESSAGES,
          ],
        },
      },
      {},
    );
    return conversation ? conversation.messages.reverse() : [];
  }

  async joinConversation(
    userId: UserId,
    conversationId: ConversationId,
  ): Promise<any> {
    const result = await this.conversationModel.findById(
      conversationId,
      {},
      { populate: { path: 'userIds', select: '_id avatar username email' } },
    );
    if (result.notificationForWho && result.notificationForWho.equals(userId)) {
      result.notificationForWho = undefined;
    }
    await result.save();
    result.messages = result.messages
      .slice(0, LIMIT_AND_SKIP_MESSAGES)
      .reverse();
    return result;
  }

  async createConversation(userId: UserId, friendId: UserId) {
    const existedConversation = await this.conversationModel.findOne({
      userIds: [userId, friendId],
    });
    if (existedConversation) {
      return false;
    }
    return this.conversationModel.create({
      userIds: [userId, friendId],
      messages: [],
    });
  }

  async sendMessage(sendMessageDto: SendMessageDto) {
    const conversationId = convertToMongoId<ConversationId>(
      sendMessageDto.conversationId,
    );
    const messageId = new Types.ObjectId();
    const receiverId = convertToMongoId<UserId>(sendMessageDto.receiverId);
    await this.ChangeNotificationToWho(conversationId, receiverId);
    const result = await this.conversationModel.findByIdAndUpdate(
      sendMessageDto.conversationId,
      {
        $push: {
          messages: {
            $each: [
              {
                _id: messageId,
                message: sendMessageDto.message,
                date: new Date(),
                userId: sendMessageDto.userId,
              },
            ],
            $position: 0,
          },
        },
      },
    );
    return { result, messageId };
  }
}
