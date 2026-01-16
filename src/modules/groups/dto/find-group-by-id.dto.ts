import { IsString } from 'class-validator';

export class FindGroupById {
  @IsString()
  groupId: string;
}
