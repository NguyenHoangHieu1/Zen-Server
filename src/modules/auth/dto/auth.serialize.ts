import { User } from 'src/modules/users/entities/User.entity';

export function authSerialize(user: User) {
  return {
    username: user.username,
    email: user.email,
    avatar: user.avatar || '',
    createdAt: user.createdAt.getTime().toString(),
    password: user.password,
  };
}
