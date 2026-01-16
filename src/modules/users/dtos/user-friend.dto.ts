import { IsOptional, IsString } from 'class-validator';

export class UserFriendDto {
  @IsString()
  @IsOptional()
  userId: string;
}
