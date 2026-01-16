import { Module } from '@nestjs/common';
import { ConversationGroupsService } from './conversation-groups.service';
import { ConversationGroupsGateway } from './conversation-groups.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ConversationGroups,
  ConversationGroupsSchema,
} from './entities/conversation-group.entity';

@Module({
  providers: [ConversationGroupsGateway, ConversationGroupsService],
  imports: [
    MongooseModule.forFeature([
      { name: ConversationGroups.name, schema: ConversationGroupsSchema },
    ]),
  ],
})
export class ConversationGroupsModule {}
