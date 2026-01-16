import { IsString, IsObject, IsOptional } from 'class-validator';
import {
  NotificationOptions,
  NotificationType,
} from '../entities/notification.entity';
import { FindUserDto } from 'src/modules/users/dtos/find-user.dto';
import { Transform } from 'class-transformer';

export class CreateNotificationDto implements FindUserDto {
  @IsString()
  userId: string;

  @IsString()
  @Transform((params) => {
    const type: NotificationType = params.value;
    switch (type) {
      case 'post-comment':
      case 'accept-friend':
      case 'friend-request':
      case 'ban':
      case 'warning':
      case 'restrict':
        return type;
      default:
        return 'general';
    }
  })
  notificationType: NotificationType;

  @IsObject()
  @IsOptional()
  options?: NotificationOptions;

  @IsString()
  @IsOptional()
  notificationHeader?: string;

  @IsString()
  @IsOptional()
  notificationBody?: string;
}
