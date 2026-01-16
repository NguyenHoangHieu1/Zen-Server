import { Module } from '@nestjs/common';
import { ChatSystemService } from './chat-system.service';
import { ChatSystemController } from './chat-system.controller';
import { Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatSystem, ChatSystemSchema } from './entities/chat-system.entity';
import { ConversationsModule } from 'src/modules/conversations/conversations.module';
import { ConversationGroupsModule } from 'src/modules/conversation-groups/conversation-groups.module';

@Module({
  controllers: [ChatSystemController],
  providers: [ChatSystemService],
  imports: [
    MongooseModule.forFeature([
      { name: ChatSystem.name, schema: ChatSystemSchema },
    ]),
    ConversationsModule,
    ConversationGroupsModule,
  ],
  exports: [ChatSystemService],
})
export class ChatSystemModule {}
