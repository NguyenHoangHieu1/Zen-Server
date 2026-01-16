import { UsersService } from './../users/users.service';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectModel } from '@nestjs/mongoose';
import { CommentType, Post, ReplyType } from './entities/post.entity';
import { Model } from 'mongoose';
import { CreateCommentDto } from './dto/create-comment.dto';
import mongoose from 'mongoose';
import { UserId } from 'src/common/types/User';
import {
  Comment,
  CommentId,
  PostDeserialized,
  PostId,
} from 'src/common/types/Post';
import { OptionSearchDto } from 'src/cores/globalDtos/optionsSearch.dto';
import { checkImageType } from 'src/common/utils/checkImageType';
import { SupabaseStorageService } from 'src/common/services/supabase-storage.service';
import { PostsRedisService } from 'src/modules/de-serialize-in-redis/posts.redis.service';
import { FindPostsThroughQueryByDto } from './dto/find-posts.dto';
import {
  hGetAllPost,
  hSetPost,
  incrByPostsCount,
  sAddPostFiles,
  sAddPostLikes,
  pfAddPostViews,
  zAddPosts,
  sRemPostLike,
  savePostsInRedis,
} from 'src/common/RedisFn/post-redis';
import { RandomNumber } from 'src/common/utils/randomNumber';
import { GroupsService } from 'src/modules/groups/groups.service';
import { GroupId } from 'src/common/types/Group';
import { convertToMongoId } from 'src/common/utils/ConvertToMongoId';
import { postsDeserialize } from './posts.deserialize.util';
import { NotificationService } from 'src/modules/notification/notification.service';
import { warn } from 'console';
import { User } from '../users/entities/User.entity';
@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly postsRedisService: PostsRedisService,
    @Inject(forwardRef(() => GroupsService))
    private readonly groupsService: GroupsService,
    private readonly notificationService: NotificationService,
    private readonly supabaseStorage: SupabaseStorageService,
  ) {}

  async countPosts(userId?: UserId) {
    return this.postModel.countDocuments({ userId });
  }

  async getAllComments({ postId }: { postId: PostId }) {
    try {
      // AGGREGATE FUNCTION WAY
      // const post: Post = (
      //   await this.postModel.aggregate([
      //     {
      //       $match: { _id: postId },
      // },
      //     {
      //       $addFields: {
      //         comments: {
      //           $map: {
      //             input: '$comments',
      //             as: 'comment',
      //             in: {
      //               $mergeObjects: [
      //                 '$$comment',
      //                 {
      //                   replies: {
      //                     $slice: ['$$comment.replies', -3],
      //                   },
      //                   repliesCount: {
      //                     $size: '$$comment.replies',
      //                   },
      //                 },
      //               ],
      //             },
      //           },
      //         },
      //       },
      //     },
      //   ])
      // )[0];
      const post = await this.postModel.findById(postId);
      post.comments = post.comments.map((comment) => {
        comment.replies = comment.replies.slice(0, 3);
        return comment;
      });
      return post.comments;
    } catch (error) {
      throw new BadRequestException('Wrong Id or internal error');
    }
  }

  async getReplies({
    postId,
    commentId,
  }: {
    postId: PostId;
    commentId: CommentId;
  }) {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new BadRequestException('No Post found!');
    }
    const comment = post.comments.find((cmt) => {
      return cmt._id.equals(commentId);
    });
    return comment.replies;
  }

  async getPostsFromOneUser({
    optionSearchDto,
    userId,
    userPostsId,
  }: {
    optionSearchDto: OptionSearchDto;
    userId: UserId;
    userPostsId: UserId;
  }) {
    try {
      const postsCount = await this.postModel.countDocuments({
        userId: userPostsId,
        mode: { $ne: 'private' },
        groupId: { $exists: false },
      });

      const queries = {
        userId: { $eq: userPostsId },
      };
      queries['groupId'] = {
        $exists: false,
      };
      if (optionSearchDto.searchInput) {
        queries['postHeading'] = optionSearchDto.searchInput;
      }
      const postsDb = await this.getPostsAggregate({
        optionSearchDto: optionSearchDto,
        postsCount: postsCount,
        userPostsId,
      });
      const posts = postsDeserialize(postsDb, userId);
      const postIdsToUpdate = await savePostsInRedis({
        posts,
        userId,
        postSerializeFn: this.postsRedisService.serialize,
      });
      await this.updateViewsForPosts(postIdsToUpdate, userId);

      return { postsCount, posts };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async updateViewsForPosts(postIdsToUpdate: PostId[], userId: UserId) {
    console.log('The post Id to update is', postIdsToUpdate);
    return this.postModel.updateMany(
      { _id: { $in: postIdsToUpdate } },
      { $inc: { views: 1 } },
    );
  }

  /**This is for getPosts & GetPostsFromOneUser */
  async getPostsAggregate({
    optionSearchDto,
    postsCount,
    userPostsId,
  }: {
    postsCount: number;
    optionSearchDto: OptionSearchDto;
    userPostsId?: UserId;
  }) {
    const queries: Record<any, any> = {
      groupId: { $exists: false },
    };
    if (userPostsId) {
      queries.userId = { $eq: userPostsId };
    }
    return this.postModel.aggregate([
      {
        $match: queries,
      },
      {
        $skip: RandomNumber(postsCount),
      },
      {
        $limit: optionSearchDto.limit || 10,
      },
      {
        $addFields: {
          commentsCount: { $size: '$comments' },
        },
      },
      {
        $addFields: {
          comments: { $slice: ['$comments', 0, 3] },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $addFields: {
          user: { $first: '$user' },
        },
      },
      {
        $project: {
          _id: 1,
          postBody: 1,
          postHeading: 1,
          views: 1,
          userId: 1,
          files: 1,
          images: 1,
          likes: 1,
          mode: 1,
          comments: 1,
          createdAt: 1,
          updatedAt: 1,
          __v: 1,
          commentsCount: 1,
          user: {
            _id: 1,
            username: 1,
            email: 1,
            avatar: 1,
            __v: 1,
          },
        },
      },
    ]);
  }

  // This is good Usage of aggregate function
  async getPosts(
    optionSearchDto: FindPostsThroughQueryByDto & OptionSearchDto,
    userId: UserId,
  ) {
    try {
      let postsCount = await this.postModel.countDocuments({
        groupId: { $exists: false },
      });
      let queries = {};
      queries['groupId'] = {
        $exists: false,
      };
      if (optionSearchDto.searchInput) {
        queries['postHeading'] = optionSearchDto.searchInput;
      }

      const postsDb = await this.getPostsAggregate({
        optionSearchDto: optionSearchDto,
        postsCount: postsCount,
      });
      const posts = postsDeserialize(postsDb, userId);
      const postIdsToUpdate = await savePostsInRedis({
        posts,
        userId,
        postSerializeFn: this.postsRedisService.serialize,
      });

      await this.updateViewsForPosts(postIdsToUpdate, userId);

      return { posts, postsCount: postsCount };
    } catch (error) {
      console.log(error);
      throw new BadRequestException('UserId is wrong or the options are wrong');
    }
  }

  async create(
    userId: UserId,
    createPostDto: CreatePostDto,
    files: Express.Multer.File[] = [],
  ) {
    const filesProp: string[] = [];
    const images: string[] = [];

    // Upload all files to Supabase in parallel
    const uploadPromises = files.map(async (file) => {
      if (checkImageType(file)) {
        const imageUrl = await this.supabaseStorage.uploadPostImage(
          file,
          userId.toString(),
        );
        images.push(imageUrl);
      } else {
        const fileUrl = await this.supabaseStorage.uploadToFolder(
          file,
          'post-files',
        );
        filesProp.push(fileUrl);
      }
    });
    await Promise.all(uploadPromises);

    let groupId = undefined;
    if (createPostDto.groupId) {
      groupId = convertToMongoId<GroupId>(createPostDto.groupId);
    }

    const post = await this.postModel.create({
      ...createPostDto,
      files: filesProp,
      images,
      userId,
      groupId,
    });
    if (createPostDto.groupId) {
      const groupId = convertToMongoId<GroupId>(createPostDto.groupId, true);
      await this.groupsService.createPost(groupId, post._id);
    }
    const postSerialized = this.postsRedisService.serialize(post);
    await Promise.all([
      hSetPost(post._id, postSerialized),
      sAddPostLikes(post._id, userId),
      post.files.length > 0 ? sAddPostFiles(post._id, post.files) : undefined,
      zAddPosts(post._id),
      incrByPostsCount(),
    ]);
    return post;
  }

  async findPost(postId: PostId, userId: UserId) {
    try {
      const post = (
        await this.postModel.aggregate([
          {
            $match: { _id: postId },
          },
          {
            $addFields: {
              commentsCount: { $size: '$comments' },
            },
          },
          {
            $addFields: {
              comments: { $slice: ['$comments', 0, 5] },
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'user',
            },
          },
          {
            $addFields: {
              user: { $first: '$user' },
            },
          },
          {
            $project: {
              _id: 1,
              postBody: 1,
              postHeading: 1,
              views: 1,
              userId: 1,
              files: 1,
              images: 1,
              likes: 1,
              mode: 1,
              comments: 1,
              createdAt: 1,
              updatedAt: 1,
              __v: 1,
              user: {
                _id: 1,
                username: 1,
                email: 1,
                avatar: 1,
                __v: 1,
              },
              commentsCount: 1,
            },
          },
        ])
      )[0];
      if (!post) {
        throw new BadRequestException('No Post Found!');
      }
      const postIdsToUpdate = await savePostsInRedis({
        posts: [post],
        userId,
        postSerializeFn: this.postsRedisService.serialize,
      });

      await this.updateViewsForPosts(postIdsToUpdate, userId);

      return postsDeserialize([post], userId)[0];
    } catch (error) {
      console.log(error);
      if (error.message === 'No Post Found!') {
        throw new BadRequestException('No Post Found!');
      }
      throw new InternalServerErrorException('Server went down... :(');
    }
    // const postInRedisSerialized = await hGetAllPost(postId);
    // if (Object.keys(postInRedisSerialized).length > 0) {
    //   const postInDeserialized = await this.postsRedisService.deserialize(
    //     postId,
    //     userId,
    //     postInRedisSerialized,
    //   );
    //   return postInDeserialized;
    // }
  }

  async edit(postId: string, updatePostDto: UpdatePostDto) {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new BadRequestException('No post was found!');
    }
    Object.assign(post, updatePostDto);
    return post.save();
  }

  async createComment({
    userId,
    commentId,
    postId,
    createCommentDto,
    groupId,
  }: {
    userId: UserId;
    commentId?: CommentId;
    postId: PostId;
    createCommentDto: CreateCommentDto;
    groupId: GroupId;
  }) {
    try {
      const user = await this.usersService.findUser(userId);
      const createdCommentId = new mongoose.Types.ObjectId() as CommentId;
      let createdComment: CommentType = {
        user: {
          username: user.username,
          avatar: user.avatar,
          _id: userId,
        },
        comment: createCommentDto.comment,
        _id: createdCommentId,
        replies: [],
        createdAt: new Date(),
      };
      const post = await this.postModel.findById(postId);
      let userToNotified: UserId;
      if (commentId) {
        let indexComment = 0;
        const comment = post.comments.find((comment, index) => {
          indexComment = index;
          return comment._id.equals(commentId);
        });
        comment.replies.push(createdComment);
        post.comments[indexComment] = comment;
        if (!comment.user._id.equals(userId)) {
          userToNotified = comment.user._id;
        }
      } else {
        if (!post.userId.equals(userId)) {
          userToNotified = post.userId;
        }
        post.comments.push(createdComment);
      }
      if (userToNotified) {
        await this.notificationService.createGeneralNotification(
          userToNotified,
          {
            options: {
              userId: userId,
              link: postId.toString(),
              postId: postId,
              groupId: groupId || undefined,
            },
            notificationType: 'post-comment',
            notificationHeader: `${user.username} has commented your ${
              commentId ? 'comment' : 'post'
            }`,
            notificationBody: createCommentDto.comment.slice(0, 20),
          },
        );
      }
      await post.save();
      return createdComment;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'The server went down, I am sorry',
      );
    }
  }

  async toggleLike(postId: PostId, userId: UserId) {
    try {
      const post: mongoose.Document<unknown, {}, Post> &
        Post & { isLiked: boolean } & Required<{
          _id: PostId;
        }> = await this.postModel.findOneAndUpdate({ _id: postId }, [
        {
          $addFields: {
            likes: {
              $cond: {
                if: { $in: [userId, '$likes'] },
                then: { $setDifference: ['$likes', [userId]] }, // Remove userId if it's present
                else: { $concatArrays: ['$likes', [userId]] }, // Add userId if it's not present
              },
            },
          },
        },
      ]);
      const isLiked = post.likes.includes(userId);
      if (isLiked) {
        await sRemPostLike(postId, userId);
      } else await sAddPostLikes(postId, userId);
      if (!post) {
        throw new BadRequestException('No Post Found!');
      }
      return post;
    } catch (error) {
      throw new InternalServerErrorException('The server went down');
    }
  }

  async deletePost(postId: PostId, userId: UserId) {
    const post = await this.postModel.findOneAndDelete({ _id: postId, userId });
    if (!post) {
      throw new BadRequestException('No Post Found!');
    }
    return post;
  }

  /**
   * I decouple the function deleteComment to 2 functions : deleteComment and deleteReply
   * */
  async deleteReply({
    commentId,
    postId,
    replyId,
    userId,
  }: {
    postId: PostId;
    commentId: CommentId;
    replyId: CommentId;
    userId: UserId;
  }) {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new BadRequestException('Post not found');
    }
    let commentIndex: number;
    const comment = post.comments.find((comment, index) => {
      commentIndex = index;
      return comment._id.equals(commentId);
    });
    if (!comment) {
      throw new BadRequestException('Comment not found');
    }
    let replyIndex: number;
    let reply: ReplyType;
    const replies = comment.replies.filter((r, index) => {
      replyIndex = index;
      if (r._id.equals(replyId)) {
        reply = r;
      }
      return !r._id.equals(replyId);
    });
    if (!reply.user._id.equals(userId)) {
      throw new UnauthorizedException('You can not do this action');
    }
    post.comments[commentIndex].replies = replies;
    await post.save();
    return reply;
  }

  //TODO: Maybe use a aggregate function, but I am not in the mood
  async deleteComment({
    commentId,
    postId,
    userId,
  }: {
    postId: PostId;
    commentId: CommentId;
    userId: UserId;
  }) {
    const post = await this.postModel.findById(postId);
    let commentDeleted: CommentType[][number] | ReplyType = undefined;
    if (!post) {
      throw new BadRequestException('Post not found');
    }
    post.comments = post.comments.filter((comment) => {
      if (comment._id.equals(commentId)) {
        commentDeleted = comment;
        return false;
      }
      return true;
    });
    if (!commentDeleted.user._id.equals(userId)) {
      throw new UnauthorizedException('You can not do this action');
    }
    await post.save();
    return commentDeleted;
  }
}
