import { Types } from 'mongoose';
import { Brand } from './brand';
import { Mode, Post } from 'src/modules/posts/entities/post.entity';
import { UserId, UserShort } from './User';
import { GroupId } from './Group';

export type PostId = Brand<Types.ObjectId, 'PostId'>;

export type CommentId = Brand<Types.ObjectId, 'CommentId'>;

export type serializedPost = Post & {};

export type Comment = {
  userId: UserId;
  user: {
    username: string;
    avatar: string;
    _id: UserId;
  };
  comment: string;
  _id: CommentId;
  replies?: any[];
  createdAt: Date;
};

export type PostSerialized = {
  _id: string;
  postHeading: string;
  postBody: string;
  mode: Mode;
  comments: string;
  userId: string;
  groupId?: string;
  createdAt: string;
  updatedAt: string;
};

export type PostDeserialized = Omit<
  Post,
  'likes' | 'views' | 'groupId' | 'user'
> & {
  likes: string[];
  views: number;
  groupId?: GroupId;
  user: UserShort;
};
