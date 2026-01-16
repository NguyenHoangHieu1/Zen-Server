import { NotFoundException } from '@nestjs/common';
import mongoose from 'mongoose';

export const convertToMongoId = <TType>(id: any, returnError?: boolean) => {
  if (typeof id === 'string' && id.length == 24) {
    return new mongoose.Types.ObjectId(id) as TType;
  }
  if (returnError) {
    throw new NotFoundException('Not Found 404 :)');
  }
  return null;
};
