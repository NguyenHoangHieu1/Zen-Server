import { Types } from 'mongoose';
import { Brand } from './brand';

export type NotificationId = Brand<Types.ObjectId, 'NotificationId'>;
