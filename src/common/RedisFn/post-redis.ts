import {
  postFilesKey,
  postImagesKey,
  postKey,
  postLikesKey,
  postViewsKey,
  postsCountKey,
  postsKey,
} from 'src/common/RedisKeys/Post';
import { PostsRedisService } from 'src/modules/de-serialize-in-redis/posts.redis.service';
import { UsersRedisService } from 'src/modules/de-serialize-in-redis/users.redis.service';
import { Post } from 'src/modules/posts/entities/post.entity';
import {
  PostDeserialized,
  PostId,
  PostSerialized,
} from 'src/common/types/Post';
import { UserId } from 'src/common/types/User';
import { User } from 'src/modules/users/entities/User.entity';
import { client } from 'src/common/utils/redisClient';

export async function hSetPost(
  postId: PostId,
  post: PostSerialized,
): Promise<number> {
  return client.hSet(postKey(postId.toString()), post);
}

export async function sAddPostLikes(
  postId: PostId,
  userId: UserId,
): Promise<number> {
  return client.sAdd(postLikesKey(postId.toString()), userId.toString());
}

export async function pfAddPostViews(
  postId: PostId,
  userId: UserId,
): Promise<boolean> {
  return client.pfAdd(postViewsKey(postId.toString()), userId.toString());
}

export async function sAddPostFiles(
  postId: PostId,
  files: string[],
): Promise<number> {
  if (files.length > 0) {
    return client.sAdd(postFilesKey(postId.toString()), files);
  }
}

export async function sAddPostImages(
  postId: PostId,
  images: string[],
): Promise<number> {
  if (images.length > 0) {
    return client.sAdd(postImagesKey(postId.toString()), images);
  }
}

export async function zAddPosts(postId: PostId): Promise<number> {
  return client.zAdd(postsKey(), {
    value: postId.toString(),
    score: new Date().getTime(),
  });
}

export async function setPostsCount(postsCount: number) {
  return client.set(postsCountKey(), postsCount);
}

export async function incrByPostsCount(): Promise<number> {
  return client.incrBy(postsCountKey(), 1);
}

export async function hGetAllPost(postId: PostId): Promise<PostSerialized> {
  return client.hGetAll(
    postKey(postId.toString()),
  ) as unknown as PostSerialized;
}

export async function sRemPostLike(
  postId: PostId,
  userId: UserId,
): Promise<number> {
  return client.sRem(postLikesKey(postId.toString()), userId.toString());
}

export async function savePostsInRedis({
  posts,
  userId,
  postSerializeFn,
}: {
  posts: (Omit<Post, 'likes'> & {
    isLiked: boolean;
    user: User;
    likes: number;
  })[];
  userId: UserId;
  postSerializeFn: PostsRedisService['serialize'];
}) {
  const redisQuerisForViews = [];
  const redisQueriesForLikes = [];
  const redisQueriesForFiles = [];
  const redisQueriesForPosts = [];
  const redisQueriesForImages = [];
  posts.forEach((post) => {
    redisQuerisForViews.push(pfAddPostViews(post._id, userId));
    redisQueriesForImages.push(sAddPostImages(post._id, post.images));
    redisQueriesForFiles.push(sAddPostFiles(post._id, post.files));
    redisQueriesForPosts.push(
      hSetPost(post._id, postSerializeFn(post)),
      zAddPosts(post._id),
    );
    if (post.isLiked) {
      redisQueriesForLikes.push(sAddPostLikes(post._id, userId));
    }
  });
  const results = await Promise.all(redisQuerisForViews);
  await Promise.all([
    ...redisQueriesForFiles,
    ...redisQueriesForLikes,
    ...redisQueriesForPosts,
  ]);
  const postIdsToUpdate = posts.flatMap((post, index) =>
    results[index] ? [post._id] : [],
  );
  return postIdsToUpdate;
}
