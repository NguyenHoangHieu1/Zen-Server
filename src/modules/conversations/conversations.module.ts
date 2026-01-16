import { Module, forwardRef } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationsGateway } from './conversations.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Conversation,
  conversationSchema,
} from './entities/conversation.entity';
import { ConversationsController } from './conversations.controller';
import { UsersModule } from '../users/users.module';
import { User, UserSchema } from '../users/entities/User.entity';

@Module({
  providers: [ConversationsGateway, ConversationsService],
  controllers: [ConversationsController],
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: conversationSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  exports: [ConversationsService],
})
export class ConversationsModule {}
