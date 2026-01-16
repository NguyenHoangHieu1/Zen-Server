import { IsString } from 'class-validator';
import { UserFriendDto } from 'src/modules/users/dtos/user-friend.dto';

export class FindNotificationById extends UserFriendDto {
  @IsString()
  notificationId: string;
}
