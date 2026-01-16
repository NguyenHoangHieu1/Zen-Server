import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { ConversationGroupsService } from './conversation-groups.service';
import { CreateConversationGroupDto } from './dto/create-conversation-group.dto';
import { UpdateConversationGroupDto } from './dto/update-conversation-group.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ConversationGroupsGateway {
  constructor(
    private readonly conversationGroupsService: ConversationGroupsService,
  ) {}

  @SubscribeMessage('createConversationGroup')
  create(
    @MessageBody() createConversationGroupDto: CreateConversationGroupDto,
  ) {
    return this.conversationGroupsService.create(createConversationGroupDto);
  }

  @SubscribeMessage('findAllConversationGroups')
  findAll() {
    return this.conversationGroupsService.findAll();
  }

  @SubscribeMessage('findOneConversationGroup')
  findOne(@MessageBody() id: number) {
    return this.conversationGroupsService.findOne(id);
  }

  @SubscribeMessage('updateConversationGroup')
  update(
    @MessageBody() updateConversationGroupDto: UpdateConversationGroupDto,
  ) {
    return this.conversationGroupsService.update(
      updateConversationGroupDto.id,
      updateConversationGroupDto,
    );
  }

  @SubscribeMessage('removeConversationGroup')
  remove(@MessageBody() id: number) {
    return this.conversationGroupsService.remove(id);
  }
}
