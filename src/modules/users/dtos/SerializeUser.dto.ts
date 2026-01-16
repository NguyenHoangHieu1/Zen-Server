import { Expose, Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';
import { UserId } from 'src/common/types/User';
export class SerializedUser {
  @Expose()
  @Transform((value) => {
    if (value.obj._id) {
      return value.obj._id.toString();
    }
    if (value.obj.req) {
      return value.obj.req.user._id.toString();
    }
    return '';
  })
  _id: Types.ObjectId;
  @Expose()
  username: string;
  @Expose()
  email: string;
  @Expose()
  avatar: string;
}

export class SerializedUserArray {
  @Expose()
  @Type(() => SerializedUser)
  users: SerializedUser[];
  @Expose()
  usersCount: number;
}
