import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { Server, Socket } from 'socket.io';
import { SendMessageDto } from './dto/send-message.dto';
import { socketNameEmit, socketNameOn } from 'src/common/utils/SocketName';
import { JoinConversationDto } from './dto/join-conversation.dto';
import { convertToMongoId } from 'src/common/utils/ConvertToMongoId';
import { UserId } from 'src/common/types/User';
import { ConversationId } from 'src/common/types/conversation';
import { FindUserDto } from 'src/modules/users/dtos/find-user.dto';
import { Types } from 'mongoose';

@WebSocketGateway({
  namespace: 'conversations',
  cors: {
    origin: '*',
  },
})
export class ConversationsGateway implements OnGatewayConnection {
  constructor(private readonly conversationsService: ConversationsService) {}

  @WebSocketServer()
  socket: Server;

  handleConnection(@ConnectedSocket() client: Socket) {
    const userId = client.handshake.query.userId;
    if (userId !== 'undefined') {
      client.join(client.handshake.query.userId as string);
    } else {
      client.disconnect();
    }
  }

  @SubscribeMessage(socketNameOn.joinAllChatRoom)
  async joinAllChatRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: FindUserDto,
  ) {
    const userId = convertToMongoId<UserId>(body.userId, true);
    const conversationIds =
      await this.conversationsService.getAllConversationIds(userId);

    conversationIds.forEach((id) => {
      socket.join(id._id.toString());
    });
    return conversationIds;
  }

  @SubscribeMessage(socketNameOn.joinChatRoom)
  async joinChatRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: JoinConversationDto,
  ) {
    // This is for leave all rooms and attend in 1 room only
    // but this is not suitable for our project since we want to get notifications from everyone :)
    // let i = 0;
    // socket.rooms.forEach((room) => {
    //   if (i !== 0) {
    //     socket.leave(room);
    //   }
    //   i++;
    // });
    socket.join(body.conversationId);
    const userId = convertToMongoId<UserId>(body.userId);
    const conversationId = convertToMongoId<ConversationId>(
      body.conversationId,
    );
    const result = await this.conversationsService.joinConversation(
      userId,
      conversationId,
    );

    return result;
  }

  @SubscribeMessage(socketNameOn.sendMessage)
  async sendMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: SendMessageDto,
  ) {
    const result = await this.conversationsService.sendMessage(body);
    const dataToSendBack = {
      ...body,
      date: new Date(),
      _id: result.messageId,
      messageHidden:[]
    };
    this.socket
      .to(body.conversationId)
      .emit(socketNameEmit.receiveMessage, dataToSendBack);
  }
}
