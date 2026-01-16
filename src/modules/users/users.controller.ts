import {
  Controller,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Request,
  Get,
  Param,
  Body,
  Req,
  Patch,
  Inject,
  forwardRef,
  Response,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtGuards } from 'src/modules/auth/Passport/jwt.guards';
import { Serialize } from 'src/cores/interceptors/Serialize.interceptor';
import { UpdateUserDto } from './dtos/update-user.dto';
import { convertToMongoId } from 'src/common/utils/ConvertToMongoId';
import { UserId } from 'src/common/types/User';
import { SerializedUser, SerializedUserArray } from './dtos/SerializeUser.dto';
import { AuthService } from 'src/modules/auth/auth.service';
import { Response as res } from 'express';
import { FindUserDto } from './dtos/find-user.dto';

@Controller('users')
@UseGuards(JwtGuards)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  @Patch('ban-user')
  async banUser(@Req() req: jwtReq, @Body() data: FindUserDto) {
    const userId = convertToMongoId<UserId>(req.user._id);
    const userIdToBeBanned = convertToMongoId<UserId>(data.userId);
    return this.usersService.banUser(userId, userIdToBeBanned);
  }

  @Patch('/upload-avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @Serialize({
    SerializedDto: SerializedUser,
  })
  async uploadAvatar(
    @Request() req: jwtReq,
    @UploadedFile() file: Express.Multer.File,
    @Response() res: res,
  ) {
    const userId = convertToMongoId<UserId>(req.user._id);
    const user = await this.usersService.uploadAvatar(userId, file);
    const token = this.authService.createJwtToken(user);

    return res
      .cookie('jwtToken', token.access_token, {
        httpOnly: true,
      })
      .json(user)
      .status(201);
  }

  @Patch('change-information')
  @Serialize({
    SerializedDto: SerializedUser,
  })
  changeInformation(@Req() req: jwtReq, @Body() updatedUserDto: UpdateUserDto) {
    const userId = convertToMongoId<UserId>(req.user._id);
    return this.usersService.changeInformation(userId, updatedUserDto);
  }

  @Get(':userId')
  findUser(@Param('userId') userIdParam: string, @Req() req: jwtReq) {
    const userPageId = convertToMongoId<UserId>(userIdParam);
    const userViewingId = convertToMongoId<UserId>(req.user._id);
    return this.usersService.findUserPage(userPageId, userViewingId);
  }
}
