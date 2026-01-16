import { PartialType } from '@nestjs/mapped-types';
import { CreateGroupsJoinedDto } from './create-groups-joined.dto';

export class UpdateGroupsJoinedDto extends PartialType(CreateGroupsJoinedDto) {}
