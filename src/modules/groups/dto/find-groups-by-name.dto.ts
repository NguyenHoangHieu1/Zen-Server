import { IsString } from 'class-validator';

export class FindGroupsByName {
  @IsString()
  groupName: string;
}
