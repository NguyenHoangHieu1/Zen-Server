import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Model } from 'mongoose';
import { UserId } from 'src/common/types/User';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationId } from 'src/common/types/Notification';
import { InjectModel } from '@nestjs/mongoose';
import { UsersService } from 'src/modules/users/users.service';
import { OptionSearchDto } from 'src/cores/globalDtos/optionsSearch.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
  ) {}

  async createGeneralNotification(
    userId: UserId,
    createNotificationDto: Partial<CreateNotificationDto>,
  ) {
    return this.notificationModel.create({
      ...createNotificationDto,
      userId,
      hasSeen: false,
      expiresAt: new Date('12/31/9999'),
    });
  }

  async modifyNotification(
    notificationId: NotificationId,
    updatedNotificationDto: UpdateNotificationDto,
  ) {
    const notification = await this.notificationModel.findById(notificationId);
    Object.assign(notification, updatedNotificationDto);
    return notification.save();
  }

  //TODO: OPTIMIZE THIS LATER :)
  async switchToHasSeen(notificationId: NotificationId) {
    const notification = await this.notificationModel.findByIdAndUpdate(
      notificationId,
      {
        $set: {
          hasSeen: true,
        },
      },
    );
    if (
      notification.notificationType === 'accept-friend' &&
      !notification.hasSeen
    ) {
      notification.expiresAt = new Date(new Date().getTime() + 1 * 60 * 1000);
    }
    return notification.save();
  }

  async findMany(userId: UserId, searchOptionsDto: OptionSearchDto) {
    const notifications = await this.notificationModel.find(
      { userId },
      {},
      {
        limit: +searchOptionsDto.limit,
        skip: +searchOptionsDto.skip,
        populate: {
          path: 'options.userId',
          select: 'username avatar email _id',
        },
      },
    );
    notifications.forEach(
      async (noti) => !noti.hasSeen && (await this.switchToHasSeen(noti._id)),
    );
    return notifications;
  }

  async findOne(userId: UserId, notificationId: NotificationId) {
    return this.notificationModel.findById(notificationId);
  }

  remove(notificationId: NotificationId, userId: UserId) {
    return this.notificationModel.findOneAndDelete({
      _id: notificationId,
      userId: userId,
    });
  }

  async removeWithoutKnowingId(
    typeOfNotification: NotificationType,
    userId: UserId,
    FriendId: UserId,
  ) {
    if (typeOfNotification === 'friend-request') {
      const result = await this.notificationModel.findOneAndDelete({
        userId,
        'options.userId': FriendId,
        notificationType: typeOfNotification,
      });
      return result;
    }
  }
  async modifyNotificationWithoutId({
    updatedNotificationDto,
    userId,
    typeOfNotification,
    friendId,
  }: {
    typeOfNotification: NotificationType;
    userId: UserId;
    friendId: UserId;
    updatedNotificationDto: Partial<UpdateNotificationDto>;
  }) {
    if (typeOfNotification === 'friend-request') {
      const result = await this.notificationModel.findOneAndDelete({
        userId,
        'options.userId': friendId,
        notificationType: typeOfNotification,
      });
      Object.assign(result, updatedNotificationDto);
      return result;
    }
  }
}
