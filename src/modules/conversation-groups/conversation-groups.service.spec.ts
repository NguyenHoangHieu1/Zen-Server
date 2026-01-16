import { Test, TestingModule } from '@nestjs/testing';
import { ConversationGroupsService } from './conversation-groups.service';

describe('ConversationGroupsService', () => {
  let service: ConversationGroupsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConversationGroupsService],
    }).compile();

    service = module.get<ConversationGroupsService>(ConversationGroupsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
