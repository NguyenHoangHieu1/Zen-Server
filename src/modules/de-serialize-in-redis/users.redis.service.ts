import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { UserId, UserSerialized } from 'src/common/types/User';
import { User } from 'src/modules/users/entities/User.entity';
import { convertToMongoId } from 'src/common/utils/ConvertToMongoId';

@Injectable()
export class UsersRedisService {
  constructor() {}

  deserialize(user: UserSerialized): User {
    return {
      username: user.username,
      email: user.email,
      avatar: user.avatar || '',
      createdAt: new Date(user.createdAt),
      password: user.password,
      gender: user.gender,
      _id: convertToMongoId<UserId>(user._id),
      token: user.token,
      description: user.description,
      offlineTime: user.offlineTime ? new Date(user.offlineTime) : undefined,
      isAdmin: Boolean(user.isAdmin),
      isBanned: Boolean(user.isBanned),
      restrict: JSON.parse(user.restrict),
    };
  }
  serialize(user: User): UserSerialized {
    console.log('User Serialized:', {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      avatar: user.avatar || '',
      createdAt: user.createdAt.getTime().toString(),
      password: user.password,
      gender: user.gender,
      token: user.token || '',
      description: user.description,
      offlineTime: user.offlineTime ? user.offlineTime.toString() : '',
      isAdmin: user.isAdmin ? user.isAdmin.toString() : '',
      isBanned: user.isBanned ? user.isBanned.toString() : '',
      restrict: user.restrict ? user.restrict.toString() : '',
    });
    return {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      avatar: user.avatar || '',
      createdAt: user.createdAt.getTime().toString(),
      password: user.password,
      gender: user.gender,
      token: user.token || '',
      description: user.description,
      offlineTime: user.offlineTime ? user.offlineTime.toString() : '',
      isAdmin: user.isAdmin ? user.isAdmin.toString() : '',
      isBanned: user.isBanned ? user.isBanned.toString() : '',
      restrict: user.restrict ? user.restrict.toString() : '',
    };
  }
}
