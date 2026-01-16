import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './entities/User.entity';
import { Model, ObjectId } from 'mongoose';
import { UpdateUserDto } from './dtos/update-user.dto';
import { isValidObjectId } from 'mongoose';
import { UserId } from 'src/common/types/User';
import { FindUsersDto } from './dtos/find-users.dto';
import { OptionSearchDto } from 'src/cores/globalDtos/optionsSearch.dto';
import { checkImageType } from 'src/common/utils/checkImageType';
import { RandomNumber } from 'src/common/utils/randomNumber';
import { FriendsService } from 'src/modules/friends/friends.service';
import { PostsService } from 'src/modules/posts/posts.service';
import { SupabaseStorageService } from 'src/common/services/supabase-storage.service';
import { hSetUser } from 'src/common/RedisFn/user-redis';
import { Friend } from './entities/Friend.entity';
import { NotificationService } from '../notification/notification.service';
import { UsersRedisService } from '../de-serialize-in-redis/users.redis.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Friend.name) private readonly friendModel: Model<Friend>,
    @Inject(forwardRef(() => FriendsService))
    private readonly friendsService: FriendsService,
    @Inject(forwardRef(() => PostsService))
    private readonly postsService: PostsService,
    private readonly usersRedisServices: UsersRedisService,
    private readonly supabaseStorage: SupabaseStorageService,
  ) {}

  async banUser(userId: UserId, userIdToBeBanned: UserId) {
    const user = await this.userModel.findById(userId);
    if (!user.isAdmin) {
      throw new UnauthorizedException('You are not an admin to do it.');
    }
    const userToBeBanned = await this.userModel.findById(userIdToBeBanned);
    userToBeBanned.isBanned = true;
    await hSetUser(
      userIdToBeBanned,
      this.usersRedisServices.serialize(userToBeBanned),
    );
    return userToBeBanned.save();
  }

  async countDocuments(query?: Record<any, any>) {
    return this.userModel.countDocuments(query);
  }

  /**
   * this is for finding Users for friendsPage, only used for friends.service, I put it here because I don't
   * want to put userSchema in friends.Service, sounds a little bit clunky :3
   **/
  async findUsers({
    queries,
    usersCount,
    data,
  }: {
    queries: Record<any, any>;
    data: FindUsersDto & OptionSearchDto;
    usersCount: number;
  }) {
    return this.userModel.find(
      queries,
      { password: 0 },
      {
        skip:
          data.usersType === 'normal-user'
            ? data.skip >= 10
              ? data.skip
              : RandomNumber(usersCount)
            : data.skip,
        limit: data.limit || 10,
      },
    );
  }

  async findUserFriends(data: FindUsersDto, userId: UserId) {
    try {
      const userTable = await this.friendsService.CheckUserTable(userId);
      let queries: Record<any, any> = {};
      queries = {
        _id: {
          $in: userTable.friends,
        },
      };
      let usersCount = await this.userModel.countDocuments(queries);
      if (data.username.trim().length > 0) {
        queries.username = { $regex: new RegExp(data.username), $options: 'i' };
        usersCount = await this.userModel.countDocuments({
          username: { $regex: new RegExp(data.username), $options: 'i' },
        });
      }
      const usersDb = await this.userModel.find(
        queries,
        { password: 0 },
        {
          skip:
            data.usersType === 'normal-user'
              ? data.skip >= 10
                ? data.skip
                : RandomNumber(usersCount)
              : data.skip,
          limit: data.limit || 10,
        },
      );

      return { users: usersDb, usersCount: usersCount };
    } catch (error) {
      throw new BadRequestException('UserId is wrong or the options are wrong');
    }
  }

  async findUser(
    username: string,
    projections?: Partial<Record<keyof User, number>>,
  ): Promise<User | null>;
  async findUser(
    _id: UserId,
    projections?: Partial<Record<keyof User, number>>,
  ): Promise<User | null>;
  async findUser(
    information: string | UserId,
    projections?: Partial<Record<keyof User, number>>,
  ) {
    let user: User;
    if (isValidObjectId(information)) {
      user = await this.userModel.findById(information, projections);
    } else {
      user = await this.userModel.findOne(
        { username: information },
        projections,
      );
    }
    if (!user) {
      return null;
    }

    return user;
  }

  async findUserPage(userId: UserId, userViewingId: UserId) {
    const user = await this.userModel.findById(userId, { password: 0 });
    const postsCount = await this.postsService.countPosts(user._id);
    let friendsInfo: { isFollowing: boolean; _id: ObjectId };
    friendsInfo = (
      await this.friendModel.aggregate([
        {
          $match: { userId: userId },
        },
        {
          $addFields: {
            isFollowing: { $in: [userViewingId, '$followers'] },
            isFriend: { $in: [userViewingId, '$friends'] },
            friends: { $size: '$friends' },
            followers: { $size: '$followers' },
            followings: { $size: '$followings' },
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            friends: 1,
            followers: 1,
            followings: 1,
            isFollowing: 1,
            isFriend: 1,
          },
        },
      ])
    )[0];
    return {
      user,
      postsCount,
      friendsInfo,
    };
  }

  async changeInformation(_id: UserId, updatedUserDto: UpdateUserDto) {
    const user = await this.userModel.findById(_id);
    if (!user) {
      return new Error('Error');
    }
    Object.assign(user, updatedUserDto);
    if (updatedUserDto.offlineTime) {
      user.offlineTime = updatedUserDto.offlineTime;
    }
    return user.save();
  }

  async uploadAvatar(
    _id: UserId,
    file: Express.Multer.File,
    fileNameDefined?: string,
  ) {
    checkImageType(file);
    const user = await this.userModel.findById(_id);

    // Delete old avatar from Supabase
    if (user.avatar) {
      await this.supabaseStorage.deleteFile(user.avatar);
    }

    // Upload new avatar to Supabase
    const avatarUrl = await this.supabaseStorage.uploadAvatar(
      file,
      _id.toString(),
    );

    user.avatar = avatarUrl;
    await hSetUser(_id, { avatar: avatarUrl });
    return user.save();
  }
}
