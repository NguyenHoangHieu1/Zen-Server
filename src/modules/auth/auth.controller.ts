import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  UseGuards,
  Req,
  Request,
  UseInterceptors,
  UploadedFile,
  Response,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtGuards } from './Passport/jwt.guards';
import { Serialize } from 'src/cores/interceptors/Serialize.interceptor';
import { SerializedUser } from 'src/modules/users/dtos/SerializeUser.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ValidateUserDto } from './dto/validate-user.dto';
import { convertToMongoId } from 'src/common/utils/ConvertToMongoId';
import { UserId } from 'src/common/types/User';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChangeEmailDto } from 'src/modules/users/dtos/change-email.dto';
import { Response as res, Request as req } from 'express';
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService, // @InjectQueue('resize-image') private imageQueue: Queue,
  ) {}

  @Post('validate-account-before-register')
  validateUser(@Body() validateUserDto: ValidateUserDto) {
    return this.authService.validateAccountBeforeRegistering(validateUserDto);
  }

  @Get('validate-jwt-token')
  validateJwtToken(@Req() req: req, @Res() res: res) {
    try {
      // For middleware, but right now it ain't work :(
      // const credentials = req.headers.authorization.split(' ')[1].split('+');
      // const jwtTokenCredential = credentials[0];
      // const userIdCredential = credentials[1];
      const userId = convertToMongoId<UserId>(req.headers.userId);
      const jwtTokenCredential = req.headers.authorization.split(' ')[1];
      const result = this.authService.validateJwtToken(
        jwtTokenCredential,
        userId,
      );
      return res.status(200).json(result);
    } catch (error) {
      res.clearCookie('jwtToken', { httpOnly: true });
      return res.status(400).json({ message: 'Wrong token' });
    }
  }

  @Get('logout')
  @UseGuards(JwtGuards)
  logout(@Req() req: jwtReq, @Res() res: res) {
    if (!req.user._id) {
      throw new UnauthorizedException('You are not logged in to log out!');
    }
    res.clearCookie('jwtToken', { httpOnly: true });
    return res.status(200).json({ message: 'logout successfully' });
  }

  @Post('register')
  @UseInterceptors(FileInterceptor('avatarFile'))
  register(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() avatarFile: Express.Multer.File,
  ) {
    return this.authService.register(createUserDto, avatarFile);
  }

  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto, @Response() res: res) {
    const data = await this.authService.login(loginUserDto);
    return res
      .cookie('jwtToken', data.access_token, {
        httpOnly: true,
        sameSite: true,
        maxAge: 3600000000,
      })
      .json(data)
      .status(200);
  }

  @Patch('validate-account-before-login')
  validateAccount(@Body() tokenData: { token: string }) {
    return this.authService.validateTokenBeforeLogin(tokenData.token);
  }

  @Patch('/email')
  @UseGuards(JwtGuards)
  @Serialize({
    SerializedDto: SerializedUser,
  })
  changeEmail(@Req() req: jwtReq, @Body() data: ChangeEmailDto) {
    const userId = convertToMongoId<UserId>(req.user._id);
    return this.authService.changeEmail(data, userId);
  }

  @Patch('password')
  @UseGuards(JwtGuards)
  @Serialize({ SerializedDto: SerializedUser })
  changePassword(
    @Request() request: jwtReq,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const userId = convertToMongoId<UserId>(request.user._id);
    return this.authService.changePassword(
      userId,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
  }
}
