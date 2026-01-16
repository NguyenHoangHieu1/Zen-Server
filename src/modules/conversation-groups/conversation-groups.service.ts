import { Injectable } from '@nestjs/common';
import { CreateConversationGroupDto } from './dto/create-conversation-group.dto';
import { UpdateConversationGroupDto } from './dto/update-conversation-group.dto';

@Injectable()
export class ConversationGroupsService {
  create(createConversationGroupDto: CreateConversationGroupDto) {
    return 'This action adds a new conversationGroup';
  }

  findAll() {
    return `This action returns all conversationGroups`;
  }

  findOne(id: number) {
    return `This action returns a #${id} conversationGroup`;
  }

  update(id: number, updateConversationGroupDto: UpdateConversationGroupDto) {
    return `This action updates a #${id} conversationGroup`;
  }

  remove(id: number) {
    return `This action removes a #${id} conversationGroup`;
  }
}
