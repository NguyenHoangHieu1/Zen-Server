import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { CreateFriendDto } from './dto/create-friend.dto';
import { UpdateFriendDto } from './dto/update-friend.dto';
import { UserFriendDto } from 'src/modules/users/dtos/user-friend.dto';
import { convertToMongoId } from 'src/common/utils/ConvertToMongoId';
import { UserId } from 'src/common/types/User';
import { JwtGuards } from 'src/modules/auth/Passport/jwt.guards';
import { FindNotificationById } from 'src/modules/notification/dto/find-Notification-by-id.dto';
import { NotificationId } from 'src/common/types/Notification';
import { FindUserDto } from 'src/modules/users/dtos/find-user.dto';
import { OptionSearchDto } from 'src/cores/globalDtos/optionsSearch.dto';
import { Serialize } from 'src/cores/interceptors/Serialize.interceptor';
import { SerializedUserArray } from 'src/modules/users/dtos/SerializeUser.dto';
import { FindUsersDto } from 'src/modules/users/dtos/find-users.dto';

@Controller('friends')
@UseGuards(JwtGuards)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get('get-users')
  @Serialize({
    DeserializedDto: OptionSearchDto,
    SerializedDto: SerializedUserArray,
  })
  async getUsers(@Query() data: FindUsersDto, @Req() jwtToken: jwtReq) {
    const userId = convertToMongoId<UserId>(jwtToken.user._id);
    const result = await this.friendsService.getFriends(data, userId);
    return result;
  }
  @Patch('not-interested')
  notInterested(@Body() data: UserFriendDto, @Req() jwtReq: jwtReq) {
    const userId = convertToMongoId<UserId>(jwtReq.user._id);
    const friendId = convertToMongoId<UserId>(data.userId);
    return this.friendsService.notInterestedFriendAction(userId, friendId);
  }

  @Patch('add-friend')
  async addFriend(@Body() data: UserFriendDto, @Req() jwtReq: jwtReq) {
    const userId = convertToMongoId<UserId>(jwtReq.user._id);
    const friendId = convertToMongoId<UserId>(data.userId);
    return this.friendsService.addFriend(userId, friendId);
  }

  @Patch('accept-friend')
  async acceptFriend(
    @Body() data: FindNotificationById,
    @Req() jwtReq: jwtReq,
  ) {
    const userId = convertToMongoId<UserId>(jwtReq.user._id);
    const friendId = convertToMongoId<UserId>(data.userId);
    const notificationId = convertToMongoId<NotificationId>(
      data.notificationId,
    );
    return this.friendsService.acceptFriend(userId, friendId);
  }

  @Patch('decline-friend')
  async declineFriend(
    @Body() data: FindNotificationById,
    @Req() jwtReq: jwtReq,
  ) {
    const userId = convertToMongoId<UserId>(jwtReq.user._id);
    const friendId = convertToMongoId<UserId>(data.userId);
    const notificationId = convertToMongoId<NotificationId>(
      data.notificationId,
    );
    return this.friendsService.declineFriend(userId, friendId, notificationId);
  }

  @Patch('unfriend')
  async unfriendFriend(@Body() data: FindUserDto, @Req() req: jwtReq) {
    const userId = convertToMongoId<UserId>(req.user._id);
    const friendId = convertToMongoId<UserId>(data.userId);
    return this.friendsService.unfriendUser(userId, friendId);
  }

  @Get('/:userId')
  async getFriends(
    @Param() paramsData: FindUserDto,
    @Query() query: OptionSearchDto,
  ) {
    const userId = convertToMongoId<UserId>(paramsData.userId);
    const result = await this.friendsService.showFriends(userId, query);
    return result;
  }

  @Patch('toggle-follow-user')
  toggleFollowUser(@Body() data: FindUserDto, @Req() req: jwtReq) {
    const userIdToFollow = convertToMongoId<UserId>(data.userId);
    const userId = convertToMongoId<UserId>(req.user._id);
    return this.friendsService.toggleFollow(userIdToFollow, userId);
  }
}
