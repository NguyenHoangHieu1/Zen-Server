import {
  Body,
  Controller,
  Get,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { GetMessagesDto } from './dto/get-messages.dto';
import { JwtGuards } from 'src/modules/auth/Passport/jwt.guards';
import { convertToMongoId } from 'src/common/utils/ConvertToMongoId';
import { UserId } from 'src/common/types/User';
import { DeleteMessageDto } from './dto/delete-message.dto';

@Controller('conversations')
@UseGuards(JwtGuards)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Patch('/messages')
  deleteMessage(@Req() req: jwtReq, @Body() data: DeleteMessageDto) {
    const userId = convertToMongoId<UserId>(req.user._id);
    return this.conversationsService.deleteMessage(userId, data);
  }

  @Get('/messages')
  getMessages(@Query() query: GetMessagesDto, @Req() req: jwtReq) {
    const userId = convertToMongoId<UserId>(req.user._id, true);
    return this.conversationsService.getMessages(query, userId);
  }
}
