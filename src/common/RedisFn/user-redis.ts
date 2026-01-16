import { userKey, usersHaveRegistered } from 'src/common/RedisKeys/User';
import { UserId, UserSerialized } from 'src/common/types/User';
import { client } from 'src/common/utils/redisClient';
import { User } from 'src/modules/users/entities/User.entity';

export async function hSetUser(
  userId: UserId,
  userSerialized: Partial<UserSerialized>,
): Promise<number> {
  return client.hSet(userKey(userId.toString()), userSerialized);
}

export async function hGetUserFromUsersHaveRegistered(
  email: string,
): Promise<string> {
  return client.hGet(usersHaveRegistered(), email);
}

export async function hGetUser(userId: UserId): Promise<Partial<User>> {
  return client.hGetAll(userKey(userId.toString())) as unknown as Partial<User>;
}

export async function hDeleteUsersHaveRegistered(email: string) {
  return client.hDel(usersHaveRegistered(), email);
}

export async function hSetUsersHaveRegistered(
  userId: UserId,
  email: string,
): Promise<number> {
  return client.hSet(usersHaveRegistered(), email, userId.toString());
}
