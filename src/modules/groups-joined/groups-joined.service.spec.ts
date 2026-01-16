import { Test, TestingModule } from '@nestjs/testing';
import { GroupsJoinedService } from './groups-joined.service';

describe('GroupsJoinedService', () => {
  let service: GroupsJoinedService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GroupsJoinedService],
    }).compile();

    service = module.get<GroupsJoinedService>(GroupsJoinedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
