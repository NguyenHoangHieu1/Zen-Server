import { Test, TestingModule } from '@nestjs/testing';
import { ChatSystemController } from './chat-system.controller';
import { ChatSystemService } from './chat-system.service';

describe('ChatSystemController', () => {
  let controller: ChatSystemController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatSystemController],
      providers: [ChatSystemService],
    }).compile();

    controller = module.get<ChatSystemController>(ChatSystemController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
