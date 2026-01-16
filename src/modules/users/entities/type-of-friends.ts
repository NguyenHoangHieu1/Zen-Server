import { IsEnum, IsString } from 'class-validator';

export type typeOfFriends =
  | 'not-interested-users'
  | 'recommend-users'
  | 'sent-request-users';

export enum typeOfFriendsEnum {
  'not-interested-users',
  'recommend-users',
  'sent-request-users',
}

export class TypeOfFriendsDto {
  @IsEnum(typeOfFriendsEnum)
  typeOfFriends: typeOfFriends;
}
