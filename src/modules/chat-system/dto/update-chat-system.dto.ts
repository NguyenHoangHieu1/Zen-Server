import { PartialType } from '@nestjs/mapped-types';
import { CreateChatSystemDto } from './create-chat-system.dto';

export class UpdateChatSystemDto extends PartialType(CreateChatSystemDto) {}
