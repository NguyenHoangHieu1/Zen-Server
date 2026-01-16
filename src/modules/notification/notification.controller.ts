import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { JwtGuards } from 'src/modules/auth/Passport/jwt.guards';
import { convertToMongoId } from 'src/common/utils/ConvertToMongoId';
import { UserId } from 'src/common/types/User';
import { FindNotificationById } from './dto/find-Notification-by-id.dto';
import { NotificationId } from 'src/common/types/Notification';

@Controller('notifications')
@UseGuards(JwtGuards)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // @Patch("toggle-seen")
  // toggleSeenNotification(@Req()req:jwtReq,@Body() data: FindNotificationById){
  //   const userId = convertToMongoId<UserId>(req.user._id)
  //   const notificationId = convertToMongoId<NotificationId>(data.notificationId)
  //   return this.notificationService.modifyNotification(notificationId,{hasSeen:})
  // }

  @Delete('/:id')
  deleteNotification(@Req() req: jwtReq, @Param('id') data: string) {
    const userId = convertToMongoId<UserId>(req.user._id);
    const notificationId = convertToMongoId<NotificationId>(data);
    return this.notificationService.remove(notificationId, userId);
  }

  @Post()
  create(
    @Body() createNotificationDto: CreateNotificationDto,
    @Req() jwtReq: jwtReq,
  ) {
    const userId = convertToMongoId<UserId>(jwtReq.user._id);
    return this.notificationService.createGeneralNotification(
      userId,
      createNotificationDto,
    );
  }

  @Get()
  getNotification(@Req() jwtReq: jwtReq) {
    const userId = convertToMongoId<UserId>(jwtReq.user._id);
    return this.notificationService.findMany(userId, {
      limit: 5,
      skip: 0,
      searchInput: '',
    });
  }
}
