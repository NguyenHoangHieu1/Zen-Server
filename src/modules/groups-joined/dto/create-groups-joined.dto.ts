import { IsString } from 'class-validator';
import { UserId } from 'src/common/types/User';

export class CreateGroupsJoinedDto {
  @IsString()
  userId: UserId;
}
