import { Types } from 'mongoose';
import { Brand } from './brand';
import { convertToMongoId } from 'src/common/utils/ConvertToMongoId';
import { User } from 'src/modules/users/entities/User.entity';

export type UserId = Brand<Types.ObjectId, 'UserId'>;

export type UserShort = Pick<User, 'avatar' | 'email' | 'username'> & {
  _id: string;
};

export type UserSerialized = {
  username: string;
  email: string;
  avatar: string;
  createdAt: string;
  password: string;
  gender: string;
  token: string;
  _id: string;
  description: string;
  offlineTime: string;
  isAdmin: string;
  isBanned: string;
  restrict: string;
};
