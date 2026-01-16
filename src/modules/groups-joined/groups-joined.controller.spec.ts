import { Test, TestingModule } from '@nestjs/testing';
import { GroupsJoinedController } from './groups-joined.controller';
import { GroupsJoinedService } from './groups-joined.service';

describe('GroupsJoinedController', () => {
  let controller: GroupsJoinedController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsJoinedController],
      providers: [GroupsJoinedService],
    }).compile();

    controller = module.get<GroupsJoinedController>(GroupsJoinedController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
