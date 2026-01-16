import { Test, TestingModule } from '@nestjs/testing';
import { ConversationGroupsGateway } from './conversation-groups.gateway';
import { ConversationGroupsService } from './conversation-groups.service';

describe('ConversationGroupsGateway', () => {
  let gateway: ConversationGroupsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConversationGroupsGateway, ConversationGroupsService],
    }).compile();

    gateway = module.get<ConversationGroupsGateway>(ConversationGroupsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
