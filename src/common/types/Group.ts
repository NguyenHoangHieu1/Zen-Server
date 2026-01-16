import { Types } from 'mongoose';
import { Brand } from './brand';

export type GroupId = Brand<Types.ObjectId, 'GroupId'>;
