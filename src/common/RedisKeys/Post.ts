import { UserId } from 'src/common/types/User';
export const postsKey = () => `posts`;
export const postKey = (id: string) => `post:${id}`;
export const postViewsKey = (id: string) => `post#views:${id}`;
export const postLikesKey = (id: string) => `post#likes:${id}`;
export const postFilesKey = (id: string) => `post#files:${id}`;
export const postImagesKey = (id: string) => `post#images:${id}`;
export const postsCountKey = () => `postsCount`;
// export const postCommentKey = (commentId: string) =>
//   `post#comments#replies:${commentId}`;
// export const postReplyKey = (replyId: string) =>
//   `post#comments#replies:${replyId}`;
