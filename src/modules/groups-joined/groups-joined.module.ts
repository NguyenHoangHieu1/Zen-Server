import { Module } from '@nestjs/common';
import { GroupsJoinedService } from './groups-joined.service';
import { GroupsJoinedController } from './groups-joined.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  GroupsJoined,
  GroupsJoinedSchema,
} from './entities/groups-joined.entity';

@Module({
  controllers: [GroupsJoinedController],
  providers: [GroupsJoinedService],
  imports: [
    MongooseModule.forFeature([
      { name: GroupsJoined.name, schema: GroupsJoinedSchema },
    ]),
  ],
  exports: [GroupsJoinedService],
})
export class GroupsJoinedModule {}
