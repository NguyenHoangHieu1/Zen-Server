import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
  Req,
  Query,
  UseInterceptors,
  UploadedFiles,
  Inject,
  Param,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtGuards } from 'src/modules/auth/Passport/jwt.guards';
import { CreateCommentDto } from './dto/create-comment.dto';
import { convertToMongoId } from 'src/common/utils/ConvertToMongoId';
import { UserId } from 'src/common/types/User';
import { Comment, CommentId, PostId } from 'src/common/types/Post';
import {
  CommentType,
  Post as PostSchema,
  ReplyType,
} from './entities/post.entity';
import { OptionSearchDto } from 'src/cores/globalDtos/optionsSearch.dto';
import { Serialize } from 'src/cores/interceptors/Serialize.interceptor';
import { FilesInterceptor } from '@nestjs/platform-express';
import { QueryPostDto } from './dto/query-post.dto';
import { QueryCommentDto } from './dto/query-comment.dto';
import { FindPostDto } from './dto/find-post.dto';
import { QueryReplyDto } from './dto/query-reply.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  findThroughIds,
  FindPostsThroughQueryByDto,
} from './dto/find-posts.dto';
import { GroupId } from 'src/common/types/Group';

@Controller('posts')
@UseGuards(JwtGuards)
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Delete('delete-reply')
  deleteReply(@Query() query: QueryPostDto, @Req() req: jwtReq) {
    const postId = convertToMongoId<PostId>(query.postId);
    const commentId = convertToMongoId<CommentId>(query.commentId);
    const userId = convertToMongoId<UserId>(req.user._id);
    const replyId = convertToMongoId<CommentId>(query.replyId);
    return this.postsService.deleteReply({
      commentId,
      postId,
      userId,
      replyId,
    });
  }

  @Delete('delete-comment')
  deleteComment(@Query() query: QueryPostDto, @Req() req: jwtReq) {
    const postId = convertToMongoId<PostId>(query.postId);
    const commentId = convertToMongoId<CommentId>(query.commentId);
    const userId = convertToMongoId<UserId>(req.user._id);
    return this.postsService.deleteComment({ commentId, postId, userId });
  }

  @Get('get-comments')
  getComments(@Query() query: QueryPostDto) {
    const postId = convertToMongoId<PostId>(query.postId);
    return this.postsService.getAllComments({ postId });
  }

  @Get('get-replies')
  getReplies(@Query() query: QueryPostDto) {
    const postId = convertToMongoId<PostId>(query.postId);
    const commentId = convertToMongoId<CommentId>(query.commentId);

    return this.postsService.getReplies({
      postId,
      commentId,
    });
  }

  @Post('/create-post')
  @UseGuards(JwtGuards)
  @UseInterceptors(FilesInterceptor('files'))
  createPost(
    @Req() request: jwtReq,
    @Body() Post: CreatePostDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const userId = convertToMongoId<UserId>(request.user._id);
    return this.postsService.create(userId, Post, files);
  }

  @Get('/get-user-posts/:userId')
  async getUserPosts(
    @Req() req: jwtReq,
    @Param('userId') userIdParam: string,
    @Query() query: OptionSearchDto,
  ) {
    const userId = convertToMongoId<UserId>(req.user._id);
    const userPostsId = convertToMongoId<UserId>(userIdParam);
    return this.postsService.getPostsFromOneUser({
      optionSearchDto: query,
      userId,
      userPostsId,
    });
  }

  @Get('/get-posts')
  async getPosts(
    @Query() query: FindPostsThroughQueryByDto,
    @Req() req: jwtReq,
  ) {
    const userId = convertToMongoId<UserId>(req.user._id);
    query.userId = query.userId && convertToMongoId<UserId>(query.userId);
    const posts = await this.postsService.getPosts(query, userId);

    return posts;
  }

  @Patch('/edit-post')
  @UseGuards(JwtGuards)
  editPost(@Body() updatedPost: UpdatePostDto, @Query() query: QueryPostDto) {
    return this.postsService.edit(query.postId, updatedPost);
  }

  @Post('/create-comment')
  @UseGuards(JwtGuards)
  async createComment(
    @Req() req: jwtReq,
    @Body() comment: CreateCommentDto,
  ): Promise<CommentType> {
    const userId = convertToMongoId<UserId>(req.user._id);
    let commentId: CommentId = undefined;
    if (comment.commentId)
      commentId = convertToMongoId<CommentId>(comment.commentId, true);
    const postId = convertToMongoId<PostId>(comment.postId, true);
    const groupId = convertToMongoId<GroupId>(comment.groupId, false);
    const result = await this.postsService.createComment({
      userId,
      commentId,
      postId,
      createCommentDto: comment,
      groupId,
    });
    return result;
  }

  @Patch('/toggle-like')
  @UseGuards(JwtGuards)
  toggleLike(@Req() req: jwtReq, @Body() data: FindPostDto) {
    const userId = convertToMongoId<UserId>(req.user._id);
    const postId = convertToMongoId<PostId>(data.postId);
    return this.postsService.toggleLike(postId, userId);
  }

  @Delete(':postId')
  @UseGuards(JwtGuards)
  deletePost(
    @Req() req: jwtReq,
    @Param('postId') data: string,
  ): Promise<PostSchema> {
    const postId = convertToMongoId<PostId>(data);
    const userId = convertToMongoId<UserId>(req.user._id);
    console.log(data, userId);
    //@ts-ignore
    return this.postsService.deletePost(postId, userId);
  }

  @Get('/:id')
  getPostById(@Param('id') data: string, @Req() req: jwtReq) {
    const postId = convertToMongoId<PostId>(data);
    const userId = convertToMongoId<UserId>(req.user._id);
    return this.postsService.findPost(postId, userId);
  }
}
