export const usersHaveRegistered = () => `usersHaveRegistered`;
export const userAccessingIdThroughEmailKey = (email: string) =>
  `user:${email}`;
export const userKey = (id: string) => `user:${id}`;
export const userFriendsKey = (id: string) => `user#friends:${id}`;
export const userFollowersKey = (id: string) => `user#followers:${id}`;
export const userFollowingsKey = (id: string) => `user#followings:${id}`;
