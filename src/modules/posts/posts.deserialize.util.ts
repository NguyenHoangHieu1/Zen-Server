import { PostId } from 'src/common/types/Post';
import { CommentType, Post } from './entities/post.entity';
import mongoose from 'mongoose';
import { UserId } from 'src/common/types/User';
import { User } from 'src/modules/users/entities/User.entity';

export function postsDeserialize(
  posts: (mongoose.Document<unknown, {}, Post> &
    Post &
    Required<{
      _id: PostId;
    }>)[],
  userId?: UserId,
): (Omit<Post, 'likes'> & {
  isLiked: boolean;
  user: User;
  likes: number;
})[] {
  return posts.map((post) => {
    const postObject = post['toObject'] ? post.toObject() : post;
    const result = {
      ...postObject,
      isLiked: userId
        ? Boolean(
            post.likes.findIndex((userLikedId) => userLikedId.equals(userId)) >=
              0,
          )
        : false,
      comments: postObject.comments
        .slice(0, 3)
        .map((comment: CommentType & { repliesCount: number }) => {
          comment.repliesCount = comment.replies.length;
          comment.replies = comment.replies.slice(0, 3);
          return comment;
        }),
      likes: post.likes.length,
    };
    return result;
  });
}
