import {
  WebSocketGateway,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { convertToMongoId } from 'src/common/utils/ConvertToMongoId';
import { UserId } from 'src/common/types/User';
import { UsersService } from './users.service';

@WebSocketGateway({
  namespace: 'users',
  cors: {
    origin: '*',
  },
})
export class UsersGateWay implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly usersService: UsersService) {}

  @WebSocketServer()
  socket: Server;

  async handleConnection(
    @ConnectedSocket() client: Socket & { userId: string },
  ) {
    // console.log("Hello connections from users", client.handshake.query.userId)
    const userId = client.handshake.query.userId;
    // undefined string type :)
    if (userId !== 'undefined') {
      client.userId = userId as string;
      const _id = convertToMongoId<UserId>(userId);
      const result = await this.usersService.changeInformation(_id, {
        offlineTime: undefined,
      });
      return result;
    } else {
      client.disconnect();
    }
  }

  async handleDisconnect(client: any) {
    if (client.userId) {
      const userId = convertToMongoId<UserId>(client.handshake.query.userId);
      await this.usersService.changeInformation(userId, {
        offlineTime: new Date(),
      });
    }
  }
}
