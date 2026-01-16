import { Controller, Get, Req, Query, UseGuards } from '@nestjs/common';
import { GroupsJoinedService } from './groups-joined.service';

import { JwtGuards } from 'src/modules/auth/Passport/jwt.guards';
import { convertToMongoId } from 'src/common/utils/ConvertToMongoId';
import { UserId } from 'src/common/types/User';
import { OptionSearchDto } from 'src/cores/globalDtos/optionsSearch.dto';
import { FindUserDto } from 'src/modules/users/dtos/find-user.dto';

@Controller('groups-joined')
@UseGuards(JwtGuards)
export class GroupsJoinedController {
  constructor(private readonly groupsJoinedService: GroupsJoinedService) {}

  @Get()
  getGroups(@Req() req: jwtReq, @Query() query: FindUserDto) {
    const userId = convertToMongoId<UserId>(query.userId);
    return this.groupsJoinedService.findGroups(userId, query);
  }
}
