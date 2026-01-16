import { Controller, Get, Body, Patch, Req, UseGuards } from '@nestjs/common';
import { ChatSystemService } from './chat-system.service';
import { JwtGuards } from 'src/modules/auth/Passport/jwt.guards';
import { convertToMongoId } from 'src/common/utils/ConvertToMongoId';
import { UserId } from 'src/common/types/User';
import { FindUserDto } from 'src/modules/users/dtos/find-user.dto';
@Controller('chat-system')
@UseGuards(JwtGuards)
export class ChatSystemController {
  constructor(private readonly chatSystemService: ChatSystemService) {}

  @Get('get-conversations')
  async getConversation(@Req() req: jwtReq) {
    const userId = convertToMongoId<UserId>(req.user._id);
    const result = await this.chatSystemService.getAllConversations(userId);

    return result;
  }

  @Patch('create-conversation')
  async createConversation(
    @Req() req: jwtReq,
    @Body() FriendIdObj: FindUserDto,
  ) {
    const userId = convertToMongoId<UserId>(req.user._id);
    const friendId = convertToMongoId<UserId>(FriendIdObj.userId);
    const result = await this.chatSystemService.createConversation({
      userId,
      friendId,
    });
    return result;
  }
}
