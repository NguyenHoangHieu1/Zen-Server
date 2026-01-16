import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  forwardRef,
} from '@nestjs/common';
import { CreateFriendDto } from './dto/create-friend.dto';
import { UpdateFriendDto } from './dto/update-friend.dto';
import { UserId } from 'src/common/types/User';
import { InjectModel } from '@nestjs/mongoose';
import { Friend } from './entities/friend.entity';
import { Document, Model } from 'mongoose';
import { UsersService } from 'src/modules/users/users.service';
import { NotificationService } from 'src/modules/notification/notification.service';
import { NotificationId } from 'src/common/types/Notification';
import { ChatSystemService } from 'src/modules/chat-system/chat-system.service';
import { OptionSearchDto } from 'src/cores/globalDtos/optionsSearch.dto';
import { createDiffieHellmanGroup } from 'crypto';
import { FindUsersDto } from 'src/modules/users/dtos/find-users.dto';
import { convertToMongoId } from 'src/common/utils/ConvertToMongoId';

@Injectable()
export class FriendsService {
  constructor(
    @InjectModel(Friend.name) private readonly friendModel: Model<Friend>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly notificationService: NotificationService,
    private readonly chatSystemService: ChatSystemService,
  ) {}
  async showFollow(userId: UserId) {
    const user = await this.CheckUserTable(userId);

    return {
      userFollowers: user.followers,
      userFollowings: user.followings,
    };
  }

  async getFriends(data: FindUsersDto & OptionSearchDto, userId: UserId) {
    try {
      const dataUserId = convertToMongoId<UserId>(data.userId);
      const userTable = await this.CheckUserTable(dataUserId || userId);
      let usersCount = await this.usersService.countDocuments();
      let queries: Record<any, any> = {};

      if (data.userId) {
        queries = {
          _id: { $in: userTable.friends },
        };
      } else if (data.usersType === 'not-interested') {
        queries = {
          _id: { $in: [...userTable.notInterested] },
        };
      } else if (data.usersType === 'has-sent-request') {
        queries = {
          _id: { $in: [...userTable.wait] },
        };
      } else {
        queries = {
          _id: {
            $nin: [
              ...userTable.notInterested,
              ...userTable.wait,
              userId,
              ...userTable.friends,
            ],
          },
        };
      }
      console.log('Skip', data.skip);
      console.log('username', data.username);
      usersCount = await this.usersService.countDocuments(queries);
      if (data.username && data.username.trim().length > 0) {
        queries.username = { $regex: new RegExp(data.username), $options: 'i' };
        usersCount = await this.usersService.countDocuments({
          username: { $regex: new RegExp(data.username), $options: 'i' },
        });
      }

      const usersDb = await this.usersService.findUsers({
        usersCount,
        data,
        queries,
      });
      return { users: usersDb, usersCount: usersCount };
    } catch (error) {
      console.log(error);
      throw new BadRequestException('UserId is wrong or the options are wrong');
    }
  }
  //This is for you following someone
  async toggleFollow(userIdToFollow: UserId, userId: UserId) {
    try {
      await this.friendModel.findOneAndUpdate({ userId: userIdToFollow }, [
        {
          $addFields: {
            followers: {
              $cond: {
                if: { $in: [userId, '$followers'] },
                then: { $setDifference: ['$followers', [userId]] },
                else: { $concatArrays: ['$followers', [userId]] },
              },
            },
          },
        },
      ]);
      const result = await this.friendModel.findOneAndUpdate({ userId }, [
        {
          $addFields: {
            followings: {
              $cond: {
                if: { $in: [userIdToFollow, '$followings'] },
                then: { $setDifference: ['$followings', [userIdToFollow]] },
                else: { $concatArrays: ['$followings', [userIdToFollow]] },
              },
            },
          },
        },
      ]);
      const isFollowing = Boolean(
        result.followings.findIndex((userId) => userId.equals(userIdToFollow)),
      );
      return isFollowing;
    } catch (error) {
      console.log('toggle-follow:', error);
      throw new InternalServerErrorException(
        'Something went wrong with our server :(',
      );
    }
  }

  async CheckUserTable(userId: UserId) {
    let userTable = await this.friendModel.findOne({ userId });
    if (!userTable) {
      userTable = await this.createFriendTable(userId);
    }
    return userTable;
  }

  // Maybe save in redis.
  async notInterestedFriendAction(userId: UserId, friendId: UserId) {
    const userTable = await this.CheckUserTable(userId);
    let isExisted: boolean = false;
    userTable.notInterested = userTable.notInterested.filter((userId) => {
      if (userId.equals(friendId)) {
        isExisted = true;
        return false;
      }
      return true;
    });
    if (!isExisted) {
      userTable.notInterested.push(friendId);
    } else {
      userTable.notInterested = userTable.notInterested.filter(
        (userId) => !userId.equals(friendId),
      );
    }
    await userTable.save();
    return friendId;
  }

  async declineFriend(
    userId: UserId,
    friendId: UserId,
    notificationId: NotificationId,
  ) {
    try {
      let userTable = await this.friendModel.findOneAndUpdate(
        { userId },
        { $pull: { await: friendId } },
      );
      await this.friendModel.findOneAndUpdate(
        { userId: friendId },
        { $pull: { wait: userId } },
      );
      await this.notificationService.remove(notificationId, userId);
      return userTable;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  // Use for client later :)
  async unfriendUser(userId: UserId, friendId: UserId) {
    await this.friendModel.findOneAndUpdate(
      {
        userId,
      },
      {
        $pull: { friends: friendId },
      },
    );
    await this.friendModel.findOneAndUpdate(
      {
        userId: friendId,
      },
      {
        $pull: { friends: userId },
      },
    );
    return { userId: friendId };
  }

  async acceptFriend(userId: UserId, friendId: UserId) {
    try {
      const user = await this.usersService.findUser(userId, { username: 1 });
      await this.friendModel.findOneAndUpdate(
        { userId },
        {
          $pull: { await: friendId },
          $push: { friends: friendId },
        },
      );
      await this.friendModel.findOneAndUpdate(
        { userId: friendId },
        {
          $pull: { wait: userId },
          $push: { friends: userId },
        },
      );
      await this.chatSystemService.createConversation({
        userId,
        friendId,
      });

      await this.notificationService.modifyNotificationWithoutId({
        userId,
        friendId,
        typeOfNotification: 'friend-request',
        updatedNotificationDto: {
          notificationType: 'accept-friend',
          options: { userId: userId, link: userId.toString() },
          userId: friendId.toString(),
          notificationHeader: `${user.username} has accepted your friend request`,
        },
      });
      return true;
    } catch (error) {
      throw new BadRequestException('SomeThing Went wrong', error);
    }
  }
  //TODO:Maybe improve this in the future when I want to use aggregate function
  async addFriend(userId: UserId, friendId: UserId) {
    const userTable = await this.CheckUserTable(userId);
    const user = await this.usersService.findUser(userId, { username: 1 });
    const friendTable = await this.CheckUserTable(friendId);
    const isAlreadySentARequest = userTable.wait.findIndex(
      (friend) => friend._id.toString() === friendId.toString(),
    );
    if (isAlreadySentARequest >= 0) {
      userTable.wait = userTable.wait.filter(
        (id) => id.toString() !== friendId.toString(),
      );
      friendTable.await = friendTable.await.filter(
        (id) => id.toString() !== userId.toString(),
      );
      await this.notificationService.removeWithoutKnowingId(
        'friend-request',
        friendId,
        userId,
      );
    } else {
      userTable.wait.push(friendId);
      userTable.notInterested = userTable.notInterested.filter((userId) => {
        return !userId.equals(friendId);
      });
      friendTable.await.push(userId);
      await this.notificationService.createGeneralNotification(friendId, {
        notificationType: 'friend-request',
        options: { userId: userId, link: userId.toString() },
        notificationHeader: 'Someone wants to be your friend!',
        notificationBody: `${user.username} has sent you a friend request`,
      });
    }
    const hasSent = isAlreadySentARequest == -1 ? true : false;
    await friendTable.save();
    await userTable.save();
    return { user: userTable, hasSent };
  }

  async createFriendTable(userId: UserId) {
    return this.friendModel.create({ userId });
  }

  async showFriends(userId: UserId, optionSearchDto: OptionSearchDto) {
    const result = await this.friendModel.findOne(
      { userId },
      {
        friends: { $slice: [optionSearchDto.skip, optionSearchDto.limit] },
        userId: 1,
        _id: 1,
      },
    );
    await result.populate({
      path: 'friends',
      select: 'username avatar _id email',
    });
    return { usersCount: result.friends.length, users: result.friends };
  }
}
