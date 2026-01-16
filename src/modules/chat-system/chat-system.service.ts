import { Injectable } from '@nestjs/common';
import { CreateChatSystemDto } from './dto/create-chat-system.dto';
import { UpdateChatSystemDto } from './dto/update-chat-system.dto';
import { InjectModel } from '@nestjs/mongoose';
import { ChatSystem } from './entities/chat-system.entity';
import { Model, QueryOptions } from 'mongoose';
import { UserId } from 'src/common/types/User';
import { ConversationsService } from 'src/modules/conversations/conversations.service';

@Injectable()
export class ChatSystemService {
  constructor(
    @InjectModel(ChatSystem.name)
    private readonly chatSystemModel: Model<ChatSystem>,
    private readonly conversationService: ConversationsService,
  ) {}

  async getAllConversations(userId: UserId) {
    const results = await this.conversationService.getConversations(userId);

    // const results = await this.checkChatSystem(userId, {
    //   populate: {
    //     path: 'conversations.userId',
    //     select: '_id username avatar email',
    //   },
    // });

    return results;
  }
  create(userId: UserId) {
    return this.chatSystemModel.create({
      conversations: [],
      userId,
    });
  }

  async checkChatSystem(userId: UserId, properties?: QueryOptions<ChatSystem>) {
    const chatSys = await this.findOne(userId, properties);
    if (!chatSys) {
      return this.create(userId);
    }
    return chatSys;
  }

  async createConversation({
    friendId,
    userId,
  }: {
    userId: UserId;
    friendId: UserId;
  }) {
    const chatSystem = await this.checkChatSystem(userId, {});
    const friendChatSystem = await this.checkChatSystem(friendId);
    const conversation = await this.conversationService.createConversation(
      userId,
      friendId,
    );
    if (conversation !== false) {
      chatSystem.conversations.push({
        conversationId: conversation._id,
        userId: friendId,
      });
      friendChatSystem.conversations.push({
        conversationId: conversation._id,
        userId: userId,
      });
      chatSystem.markModified('conversations');
      friendChatSystem.markModified('conversations');
    }
    await friendChatSystem.save();
    return chatSystem.save();
  }

  findOne(userId: UserId, properties?: QueryOptions<ChatSystem>) {
    return this.chatSystemModel.findOne({ userId }, {}, properties);
  }
}
