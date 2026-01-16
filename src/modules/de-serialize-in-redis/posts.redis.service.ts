import { Injectable } from '@nestjs/common';
import {
  postFilesKey,
  postImagesKey,
  postLikesKey,
  postViewsKey,
} from 'src/common/RedisKeys/Post';
import { userKey } from 'src/common/RedisKeys/User';
import {
  CommentType,
  Mode,
  Post,
} from 'src/modules/posts/entities/post.entity';
import { GroupId } from 'src/common/types/Group';
import {
  PostDeserialized,
  PostId,
  PostSerialized,
} from 'src/common/types/Post';
import { UserId, UserShort } from 'src/common/types/User';
import { convertToMongoId } from 'src/common/utils/ConvertToMongoId';
import { client } from 'src/common/utils/redisClient';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/modules/users/entities/User.entity';
import { UsersRedisService } from './users.redis.service';

@Injectable()
export class PostsRedisService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly usersRedisService: UsersRedisService,
  ) {}

  async deserialize(
    postId: PostId,
    userId: UserId,
    post: PostSerialized,
  ): Promise<PostDeserialized & { isLiked: boolean }> {
    let user: UserShort = {
      username: '',
      email: '',
      avatar: '',
      _id: '',
    };
    const results = await Promise.all([
      client.sMembers(postFilesKey(postId.toString())),
      client.sMembers(postImagesKey(postId.toString())),
      client.sMembers(postLikesKey(postId.toString())),
      client.PFCOUNT(postViewsKey(postId.toString())),
      client.hmGet(userKey(post.userId), Object.keys(user)),
      client.sIsMember(postLikesKey(postId.toString()), userId.toString()),
    ]);
    const files = results[0] as string[];
    const images = results[1] as string[];
    const likes = results[2] as string[];
    const views = results[3] as number;
    if (results[3][0] === null) {
      const userQueried = await this.userModel.findById(post.userId);
      user._id = userQueried._id.toString();
      user.username = userQueried.username;
      user.avatar = userQueried.avatar;
      user.email = userQueried.email;
      await client.hSet(
        userKey(user._id),
        this.usersRedisService.serialize(userQueried),
      );
    } else {
      let index = 0;
      for (const key in user) {
        user[key] = results[3][index];
        ++index;
      }
    }
    return {
      postHeading: post.postHeading,
      postBody: post.postBody,
      files,
      images,
      mode: post.mode,
      likes,
      comments: JSON.parse(post.comments) as CommentType[],
      views,
      _id: postId,
      userId: convertToMongoId<UserId>(post.userId),
      user,
      groupId: post.groupId
        ? convertToMongoId<GroupId>(post.groupId)
        : undefined,
      createdAt: new Date(+post.createdAt),
      updatedAt: new Date(+post.updatedAt),
      isLiked: results[5],
    };
  }
  serialize(post: Omit<Post, 'likes' | 'views' | 'images'>): PostSerialized {
    return {
      _id: post._id.toString(),
      userId:
        (post.userId && post.userId.toString()) || post.user._id.toString(),
      groupId: post.groupId ? post.groupId.toString() : '',
      postHeading: post.postHeading,
      postBody: post.postBody,
      mode: post.mode as Mode,
      comments: JSON.stringify(post.comments),
      createdAt: new Date(post.createdAt).getTime().toString(),
      updatedAt: new Date(post.updatedAt).getTime().toString(),
    };
  }
}
