import { Test, TestingModule } from '@nestjs/testing';
import { ChatSystemService } from './chat-system.service';

describe('ChatSystemService', () => {
  let service: ChatSystemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatSystemService],
    }).compile();

    service = module.get<ChatSystemService>(ChatSystemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
