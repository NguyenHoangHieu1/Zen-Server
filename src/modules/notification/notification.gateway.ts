import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';

import { NotificationService } from './notification.service';
import { Server, Socket } from 'socket.io';
import { socketNameEmit, socketNameOn } from 'src/common/utils/SocketName';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { FindUserDto } from 'src/modules/users/dtos/find-user.dto';
import { convertToMongoId } from 'src/common/utils/ConvertToMongoId';
import { UserId } from 'src/common/types/User';
import { undefinedString } from 'src/common/utils/undefinedString';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'notifications',
})
export class NotificationGateway implements OnGatewayConnection {
  constructor(private readonly notificationService: NotificationService) {}

  @WebSocketServer()
  socket: Server;

  handleConnection(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: FindUserDto,
  ) {
    const userId = client.handshake.query.userId as string;
    if (userId !== undefinedString) {
      client.join(client.handshake.query.userId as string);
    } else {
      client.disconnect();
    }
  }

  @SubscribeMessage(socketNameOn.sendNotification)
  async receiveNotification(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: CreateNotificationDto,
  ) {
    const userId = convertToMongoId<UserId>(body.userId);
    const notification =
      await this.notificationService.createGeneralNotification(userId, body);
    socket.to(body.userId).emit(socketNameEmit.receiveMessage, notification);
  }
}
