import { Types } from 'mongoose';
import { Brand } from './brand';

export type ReportId = Brand<Types.ObjectId, 'ReportId'>;
