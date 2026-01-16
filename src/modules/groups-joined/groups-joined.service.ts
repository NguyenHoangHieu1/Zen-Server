import { Inject, Injectable } from '@nestjs/common';
import { CreateGroupsJoinedDto } from './dto/create-groups-joined.dto';
import { UpdateGroupsJoinedDto } from './dto/update-groups-joined.dto';
import { InjectModel } from '@nestjs/mongoose';
import { GroupsJoined } from './entities/groups-joined.entity';
import { Model } from 'mongoose';
import { UserId } from 'src/common/types/User';
import { GroupId } from 'src/common/types/Group';
import { OptionSearchDto } from 'src/cores/globalDtos/optionsSearch.dto';

@Injectable()
export class GroupsJoinedService {
  constructor(
    @InjectModel(GroupsJoined.name)
    private readonly groupsJoinedModel: Model<GroupsJoined>,
  ) {}
  create({ userId }: CreateGroupsJoinedDto) {
    return this.groupsJoinedModel.create({
      userId,
      groupIds: [],
    });
  }

  async joinGroup(userId: UserId, groupId: GroupId, hasJoinedOrNot: boolean) {
    let groupJoinedTable = await this.groupsJoinedModel.findOne({ userId });
    if (!hasJoinedOrNot) {
      groupJoinedTable.groupIds.push(groupId);
      return groupJoinedTable.save();
    } else {
      return this.groupsJoinedModel.findOneAndUpdate(
        { userId },
        { $pull: { userIds: userId } },
        { new: true },
      );
    }
  }

  async findGroups(userId: UserId, optionSearchDto: OptionSearchDto) {
    let result = await this.groupsJoinedModel.findOne(
      { userId },
      {
        groupIds: { $slice: [+optionSearchDto.skip, +optionSearchDto.limit] },
      },
      { populate: 'groupIds' },
    );

    return result.groupIds;
  }

  update(userId: UserId, groupId: GroupId) {
    return this.groupsJoinedModel.findOneAndUpdate(
      { userId },
      { $addToSet: { groupIds: groupId } },
    );
  }

  remove(userId: UserId) {
    return this.groupsJoinedModel.findOneAndDelete({ userId });
  }
}
