import { Types } from 'mongoose';
import { Brand } from './brand';

export type ConversationId = Brand<Types.ObjectId, 'ConversationId'>;
export type MessageId = Brand<Types.ObjectId, 'MessageId'>;
