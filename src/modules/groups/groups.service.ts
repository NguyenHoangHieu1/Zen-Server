import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { isValidObjectId } from 'mongoose';
import { Group } from './entities/group.entity';
import { Model, Types } from 'mongoose';
import { GroupId } from 'src/common/types/Group';
import { UserId } from 'src/common/types/User';
import { FindGroupsByName } from './dto/find-groups-by-name.dto';
import { OptionSearchDto } from 'src/cores/globalDtos/optionsSearch.dto';
import { CreatePostDto } from 'src/modules/posts/dto/create-post.dto';
import { PostsService } from 'src/modules/posts/posts.service';
import { CreateGroupPostDto } from './dto/create-post-group.dto';
import { findThroughIds } from 'src/modules/posts/dto/find-posts.dto';
import { adjustQueriesForInfiniteQuery } from 'src/common/utils/adjustQueriesForInfiniteQuery';
import { PostId } from 'src/common/types/Post';
import { checkImageType } from 'src/common/utils/checkImageType';
import { GroupsJoinedService } from 'src/modules/groups-joined/groups-joined.service';
import { SupabaseStorageService } from 'src/common/services/supabase-storage.service';
import { Post } from 'src/modules/posts/entities/post.entity';
import { postsDeserialize } from 'src/modules/posts/posts.deserialize.util';
import { savePostsInRedis } from 'src/common/RedisFn/post-redis';
import { PostsRedisService } from 'src/modules/de-serialize-in-redis/posts.redis.service';
import { log } from 'console';
import { User } from '../users/entities/User.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectModel(Group.name) private readonly groupModel: Model<Group>,
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
    @Inject(forwardRef(() => PostsService))
    private readonly postService: PostsService,
    private readonly groupsJoinedService: GroupsJoinedService,
    private readonly postsRedisService: PostsRedisService,
    private readonly supabaseStorage: SupabaseStorageService,
  ) {}

  async createPost(groupId: GroupId, postId: PostId) {
    return this.groupModel.findByIdAndUpdate(groupId, {
      $addToSet: { postIds: postId },
    });
  }
  async findPosts({
    groupId,
    userId,
    optionSearchDto,
  }: {
    groupId: GroupId;
    userId?: UserId;
    optionSearchDto: OptionSearchDto;
  }) {
    const group = (
      await this.groupModel.aggregate([
        { $match: { _id: groupId } },
        {
          $project: {
            postLength: { $size: '$postIds' },
            postIds: {
              $slice: ['$postIds', optionSearchDto.skip, optionSearchDto.limit],
            },
          },
        },
        {
          $lookup: {
            from: 'posts',
            localField: 'postIds',
            foreignField: '_id',
            as: 'posts',
          },
        },
      ])
    )[0];
    console.log('GROUP:', group);
    let postsCount = group.postLength;
    //TODO: NOT THE RIGHT TYPE IN TYPESCRIPT, FIX THIS LATER
    const posts = (await this.postModel.populate(group.posts, {
      path: 'userId',
      select: 'username avatar email _id',
    })) as unknown as (mongoose.Document<unknown, {}, Post> &
      Post &
      Required<{
        _id: PostId;
      }>)[];
    const newPosts = posts.map((post) => {
      post.user = post.userId as any as User;
      return post;
    });
    const possts = postsDeserialize(newPosts, userId);
    if (userId) {
      const postIdsToUpdate = await savePostsInRedis({
        posts: possts,
        userId,
        postSerializeFn: this.postsRedisService.serialize,
      });

      await this.postService.updateViewsForPosts(postIdsToUpdate, userId);
    }
    return { postsCount, posts: possts };
  }

  async findMembers(groupId: GroupId, optionsSearchDto: OptionSearchDto) {
    const group = await this.groupModel.findById(
      groupId,
      { userIds: { $slice: [0, 1] } },
      { populate: 'userIds' },
    );
    if (!group) {
      throw new NotFoundException('No Group Found!');
    }
    return group.userIds;
  }

  async findGroupDocument(groupId: GroupId) {
    const group = await this.groupModel.findById(groupId);
    if (!group) {
      throw new NotFoundException('No Group Found!');
    }
    return group;
  }

  async changeAvatar(groupId: GroupId, avatarFile: Express.Multer.File) {
    const group = await this.findGroupDocument(groupId);
    if (!checkImageType(avatarFile)) {
      throw new BadRequestException('Wrong Image Type!');
    }

    // Delete old avatar from Supabase
    if (group.groupAvatar) {
      await this.supabaseStorage.deleteFile(group.groupAvatar);
    }

    // Upload new avatar to Supabase
    const avatarUrl = await this.supabaseStorage.uploadGroupAvatar(
      avatarFile,
      groupId.toString(),
    );

    group.groupAvatar = avatarUrl;
    return group.save();
  }

  async createGroup(
    createGroupDto: CreateGroupDto,
    avatarFile: Express.Multer.File,
    userId: UserId,
  ): Promise<Group> {
    // Upload avatar to Supabase
    const avatarUrl = await this.supabaseStorage.uploadGroupAvatar(
      avatarFile,
      `temp-${Date.now()}`,
    );

    const group = await this.groupModel.create({
      ...createGroupDto,
      isPrivate: createGroupDto.isPrivate.toLowerCase() === 'true',
      userId,
      groupAvatar: avatarUrl,
      userIds: [userId],
    });
    await this.groupsJoinedService.joinGroup(userId, group._id, false);

    return group;
  }

  async findGroup(groupId: GroupId, userId: UserId): Promise<Group | null> {
    let group: Group & { hasJoined: boolean; areYouTheHost: boolean } = (
      await this.groupModel.findById(groupId)
    ).toObject();
    group = {
      ...group,
      hasJoined: userId
        ? group.userIds.find(
            (user) => userId.toString() === user.toString(),
          ) !== undefined
        : false,
      areYouTheHost: userId ? group.userId.equals(userId.toString()) : false,
    };
    if (!group) {
      return null;
    }
    return group;
  }

  async findGroups(
    data: OptionSearchDto & findThroughIds,
    userId: UserId,
    userIdGroups?: UserId,
  ): Promise<{ groups: Group[]; groupsCount: number }> {
    let groups: Group[] = [];
    let queries: Record<any, any> = {};
    let groupsCount: number = 0;
    let queryOptions = {};
    if (userIdGroups) {
      const groupsJoined = await this.groupsJoinedService.findGroups(
        userIdGroups,
        data,
      );
      queries = adjustQueriesForInfiniteQuery<Group, GroupId>({
        idsToInclude: groupsJoined,
        searchInput: data.searchInput,
        fieldToSearch: 'groupName',
      });
      groupsCount = groupsJoined.length;
    } else {
      groupsCount = await this.groupModel.countDocuments();
      queries = adjustQueriesForInfiniteQuery<Group>({
        idsToFilter: data.ids,
        searchInput: data.searchInput,
        fieldToSearch: 'groupName',
      });
    }

    groups = await this.groupModel
      .find(queries)
      .skip(data.skip)
      .limit(data.limit)
      .transform((groups) => {
        let aGroups = groups.map((group) => {
          return {
            ...group.toObject(),
            hasJoined: group.userIds.includes(userId),
            areYouTheHost: group._id.equals(userId),
          };
        });
        return aGroups;
      });
    console.log('Groups', groups);
    return { groups, groupsCount };
  }

  async findGroupsByName(name: FindGroupsByName): Promise<Group[]> {
    return this.groupModel.find({ $text: { $search: name.toString() } });
  }

  async updateGroup(
    groupId: GroupId,
    updateGroupDto: UpdateGroupDto,
  ): Promise<Group> {
    const group = await this.groupModel.findByIdAndUpdate(
      groupId,
      updateGroupDto,
    );
    return group;
  }

  async deleteGroup(groupId: GroupId): Promise<Group> {
    return this.groupModel.findByIdAndRemove(groupId);
  }

  async joinGroup(groupId: GroupId, userId: UserId): Promise<Group> {
    let group = await this.groupModel.findById(groupId);
    let hasJoined = false;
    // TRUE = PULL, FALSE = ADD
    if (group.userIds.includes(userId)) {
      hasJoined = true;
      group = await this.groupModel.findByIdAndUpdate(
        groupId,
        { $pull: { userIds: userId } },
        { new: true },
      );
    } else {
      group = await this.groupModel.findByIdAndUpdate(
        groupId,
        { $addToSet: { userIds: userId } },
        { new: true },
      );
    }
    await this.groupsJoinedService.joinGroup(userId, groupId, hasJoined);
    return group;
  }

  async leaveGroup(userId: UserId, groupId: GroupId) {
    return this.groupModel.findByIdAndUpdate(groupId, {
      $pull: { userIds: userId },
    });
  }
}
