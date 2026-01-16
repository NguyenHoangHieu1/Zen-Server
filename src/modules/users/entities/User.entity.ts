import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { UserId } from 'src/common/types/User';

export type restrictType = {
  restrictType: 'post' | 'comment' | 'like'; // post | comment | like
  dateTillRelease: Date;
};

@Schema({ timestamps: true })
export class User {
  _id: UserId;

  @Prop({ required: true, type: String, index: 'text' })
  username: string;

  @Prop({ required: true, type: String, index: 'text', unique: true })
  email: string;

  @Prop({ required: false, type: String, default: '' })
  description: string;

  @Prop({ required: true, type: String })
  password: string;

  @Prop({ required: false, type: String, default: '' })
  avatar: string;

  @Prop({ required: true, type: String })
  gender: string;

  @Prop({ required: false, type: String })
  token: string;

  @Prop({ required: false, type: Date })
  offlineTime?: Date;

  @Prop({ required: false, type: Boolean })
  isAdmin?: boolean;

  @Prop({ required: false, type: Boolean })
  isBanned?: boolean;

  @Prop({
    required: false,
    type: [
      {
        restrictType: {
          type: String,
          required: true,
        },
        dateTillRelease: {
          type: Date,
          required: true,
        },
      },
    ],
  })
  restrict?: restrictType;

  createdAt: Date;
}

const UserSchema = SchemaFactory.createForClass(User);

export { UserSchema };
