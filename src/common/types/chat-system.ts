import { Types } from 'mongoose';
import { Brand } from './brand';

export type chatSystemId = Brand<Types.ObjectId, 'chatSystemId'>;
