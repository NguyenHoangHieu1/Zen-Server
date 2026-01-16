import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  Query,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { JwtGuards } from 'src/modules/auth/Passport/jwt.guards';
import { convertToMongoId } from 'src/common/utils/ConvertToMongoId';
import { UserId } from 'src/common/types/User';
import { GroupId } from 'src/common/types/Group';
import { FindGroupById } from './dto/find-group-by-id.dto';
import { OptionSearchDto } from 'src/cores/globalDtos/optionsSearch.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { findThroughIds } from 'src/modules/posts/dto/find-posts.dto';
import { Request } from 'express';
import { FindGroupsDto } from './dto/find-groups.dto';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post('create-group')
  @UseGuards(JwtGuards)
  @UseInterceptors(FileInterceptor('groupAvatarFile'))
  create(
    @Body() createGroupDto: CreateGroupDto,
    @Req() req: jwtReq,
    @UploadedFile() avatarFile: Express.Multer.File,
  ) {
    const userId = convertToMongoId<UserId>(req.user._id);
    return this.groupsService.createGroup(createGroupDto, avatarFile, userId);
  }

  @Get('/:id/posts')
  async getPosts(
    @Query() optionSearchDto: OptionSearchDto,
    @Param('id') param: string,
    @Req() req: Request,
  ) {
    const groupId = convertToMongoId<GroupId>(param, true);
    const regex = /userId=([^;]+)/;
    let userIdRaw = '';
    if (req.headers.cookie && req.headers.cookie.includes('jwtToken')) {
      userIdRaw = req.headers.cookie.match(regex)[1];
    }
    const userId = convertToMongoId<UserId>(userIdRaw);
    const result = await this.groupsService.findPosts({
      groupId,
      userId,
      optionSearchDto,
    });
    return result;
  }

  @Post('find-groups')
  async findGroups(
    @Body() data: findThroughIds,
    @Query() query: FindGroupsDto,
  ) {
    const userId = convertToMongoId<UserId>(query.userId);
    const userIdGroups = convertToMongoId<UserId>(query.userIdGroups);
    return this.groupsService.findGroups(
      {
        ids: data.ids,
        limit: query.limit,
        skip: query.skip,
        searchInput: query.searchInput,
      },
      userId,
      userIdGroups,
    );
  }
  @Get(':groupId')
  async findGroup(@Param('groupId') id: string, @Query() query: any) {
    const groupId = convertToMongoId<GroupId>(id);
    const userId = convertToMongoId<UserId>(query.userId);
    if (groupId === null) {
      throw new NotFoundException('Not Found Error');
    }
    const result = await this.groupsService.findGroup(groupId, userId);
    return result;
  }

  @Patch('join-group')
  @UseGuards(JwtGuards)
  joinGroup(@Req() req: jwtReq, @Body() data: FindGroupById) {
    const groupId = convertToMongoId<GroupId>(data.groupId);
    const userId = convertToMongoId<UserId>(req.user._id);
    return this.groupsService.joinGroup(groupId, userId);
  }

  @Patch('out-group')
  @UseGuards(JwtGuards)
  outGroup(@Req() req: jwtReq, @Body() data: FindGroupById) {
    const userId = convertToMongoId<UserId>(req.user._id);
    const groupId = convertToMongoId<GroupId>(data.groupId);
    console.log('Hello World');
    return this.groupsService.leaveGroup(userId, groupId);
  }

  @Patch(':id')
  @UseGuards(JwtGuards)
  updateGroup(@Body() updateGroupDto: UpdateGroupDto, @Param('id') id: string) {
    const groupId = convertToMongoId<GroupId>(id);
    return this.groupsService.updateGroup(groupId, updateGroupDto);
  }

  @Patch(':id/change-avatar')
  @UseGuards(JwtGuards)
  @UseInterceptors(FileInterceptor('avatar'))
  changeAvatarGround(
    @Param('id') paramGroupId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const groupId = convertToMongoId<GroupId>(paramGroupId);
    return this.groupsService.changeAvatar(groupId, file);
  }

  @Get(':id/members')
  @UseGuards(JwtGuards)
  findMembers(
    @Param('id') param: string,
    @Query() optionSearchDto: OptionSearchDto,
  ) {
    const groupId = convertToMongoId<GroupId>(param);
    return this.groupsService.findMembers(groupId, optionSearchDto);
  }

  @Delete()
  @UseGuards(JwtGuards)
  deleteGroup(@Body() data: FindGroupById, @Req() req: jwtReq) {
    const groupId = convertToMongoId<GroupId>(data.groupId);
    return this.groupsService.deleteGroup(groupId);
  }
}
