import {
  BadRequestException,
  Inject,
  Injectable,
  NotAcceptableException,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/modules/users/entities/User.entity';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from './dto/login-user.dto';
import { ValidateUserDto } from './dto/validate-user.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { randomBytes } from 'crypto';
import { v4 } from 'uuid';
import { UserId, UserSerialized } from 'src/common/types/User';
import { Response, response } from 'express';
import { UsersService } from 'src/modules/users/users.service';
import { UsersRedisService } from 'src/modules/de-serialize-in-redis/users.redis.service';
import {
  hGetUser,
  hGetUserFromUsersHaveRegistered,
  hSetUsersHaveRegistered,
  hSetUser,
  hDeleteUsersHaveRegistered,
} from 'src/common/RedisFn/user-redis';
import { ChangeEmailDto } from 'src/modules/users/dtos/change-email.dto';
import { FriendsService } from 'src/modules/friends/friends.service';
import { GroupsJoinedService } from 'src/modules/groups-joined/groups-joined.service';
import { ChatSystemService } from 'src/modules/chat-system/chat-system.service';
@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly usersRedisService: UsersRedisService,
    private readonly friendsService: FriendsService,
    private readonly groupsJoinedService: GroupsJoinedService,
    private readonly chatSystemService: ChatSystemService,
  ) {}

  async changeAllPassword() {
    const hashedPassword = await bcrypt.hash(
      'SonGoku@1',
      +process.env.BCRYPT_HASH,
    );
    return this.userModel.updateMany(
      {},
      { $set: { password: hashedPassword } },
    );
  }

  async checkPassword(loginUserDto: LoginUserDto, user: Partial<User>) {
    const doMatch = await bcrypt.compare(loginUserDto.password, user.password);
    if (!doMatch) {
      throw new NotAcceptableException('Wrong password', {
        cause: new Error(),
        description: 'Wrong credentials',
      });
    }
    if (!user.email || !user._id) {
      throw new UnauthorizedException('Wrong credentials');
    } else if (user.token) {
      throw new UnauthorizedException("You haven't activate the account");
    }
    return this.createJwtToken(user);
  }

  createJwtToken(user: Partial<User>) {
    const payload = {
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt,
      isAdmin: user.isAdmin,
      isBanned: user.isBanned,
    };

    return {
      access_token: this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
      }),
      userId: user._id,
    };
  }

  validateJwtToken(token: string, userId: UserId) {
    const result = this.jwtService.verify(token, {
      secret: process.env.JWT_SECRET,
    });
    if (result._id !== userId.toString()) {
      throw new BadRequestException('Wrong UserId');
    }
    return { user: result, isAdmin: result.isAdmin || false };
  }

  async validateTokenBeforeLogin(token: string) {
    const user = await this.userModel.findOne({ token: token });
    if (!user) {
      throw new BadRequestException('No User Found!');
    }
    user.token = undefined;
    await hSetUser(user._id, { token: '' });
    return user.save();
  }
  // Dung SortedSet de luu gia tri roi lay gia tri thong qua ZSCORE, lay score > 1 la ton tai, == 0 la ko ton tai
  async validateAccountBeforeRegistering(
    validateUserDto: ValidateUserDto,
  ): Promise<Response<any, Record<string, any>>> {
    const userInRedis = await hGetUserFromUsersHaveRegistered(
      validateUserDto.email,
    );
    if (userInRedis) {
      throw new BadRequestException('Email already in used', {
        cause: new Error(),
        description: 'Your Email is already in used, please use another Email!',
      });
    }
    const user = await this.userModel.findOne({ email: validateUserDto.email });
    if (user) {
      await hSetUsersHaveRegistered(user._id, user.email);
      throw new BadRequestException('Email already in used', {
        cause: new Error(),
        description: 'Your Email is already in used, please use another Email!',
      });
    }
    return response.status(200);
  }

  async register(createUserDto: CreateUserDto, avatar: Express.Multer.File) {
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      +process.env.BCRYPT_HASH,
    );
    const createdUser = await this.userModel.create({
      ...createUserDto,
      password: hashedPassword,
    });
    await this.chatSystemService.create(createdUser._id);
    let token = v4() + randomBytes(12).toString('hex');
    createdUser.token = token;

    this.mailerService.sendMail({
      from: 'hoanghieufro@gmail.com',
      to: createUserDto.email,
      subject: 'Thank you for trusting our service!',
      html: `<h1>Welcome abroad</h1>
      <h3>Welcome to Zed<h3>
      <p>Thank you so much for joining with us :) we will make sure that the experiences you get will be worth it!</p>
      <code><a href="http://localhost:3000/validate-account/${token}">Click here to verify</a></code>`,
    });
    await this.friendsService.createFriendTable(createdUser._id);
    await createdUser.save();
    let fileName = '';
    if (avatar) {
      const user = await this.usersService.uploadAvatar(
        createdUser._id,
        avatar,
      );
      fileName = user.avatar;
    }
    const redisesArray = [
      hSetUser(
        createdUser._id,
        this.usersRedisService.serialize({
          ...createdUser.toObject(),
          avatar: fileName,
        }),
      ),
      hSetUsersHaveRegistered(createdUser._id, createdUser.email),
    ];
    await this.groupsJoinedService.create({ userId: createdUser._id });
    await Promise.all(redisesArray);
    return createdUser;
  }

  checkUserIfBanned(user: Partial<User>) {
    if (user.isBanned) {
      throw new UnauthorizedException(
        'You are banned, this account no longer used in this app',
      );
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const userId = (await hGetUserFromUsersHaveRegistered(
      loginUserDto.email,
    )) as unknown as UserId;
    if (userId) {
      const userInRedisSerialized = await hGetUser(userId);
      this.checkUserIfBanned(userInRedisSerialized);
      if (Object.keys(userInRedisSerialized).length > 0) {
        return this.checkPassword(loginUserDto, userInRedisSerialized);
      }
    }

    const user = await this.userModel.findOne({ email: loginUserDto.email });
    if (!user) {
      throw new BadRequestException("Account doesn't exist", {
        cause: new Error(),
        description: 'Please create account before loggin in.',
      });
    }
    this.checkUserIfBanned(user);
    const theUser = this.usersRedisService.serialize(user);

    await Promise.all([
      hSetUser(user._id, theUser),
      hSetUsersHaveRegistered(user._id, user.email),
    ]);
    return this.checkPassword(loginUserDto, user);
  }

  async changePassword(
    userId: UserId,
    oldPassword: string,
    newPassword: string,
  ): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('No User was found');
    }
    const doMatch = await bcrypt.compare(oldPassword, user.password);
    if (!doMatch) {
      throw new BadRequestException('Wrong password.');
    }
    user.password = await bcrypt.hash(newPassword, +process.env.BCRYPT_HASH);
    await hSetUser(user._id, { password: user.password });
    await this.mailerService.sendMail({
      from: 'hoanghieufro@gmail.com',
      to: user.email,
      subject: 'Change Password!',
      html: `
      <p>If you are not the one who's doing this, please contact us through hoanghieufro@gmail.com to get help!</p>`,
    });
    return user.save();
  }
  async changeEmail(data: ChangeEmailDto, userId: UserId) {
    const user = await this.userModel.findById(userId);
    const duplicatedEmail = await this.userModel.findOne({ email: data.email });
    if (duplicatedEmail) {
      throw new BadRequestException('this email is already in used');
    }
    const oldEmail = user.email;
    if (!user) {
      throw new BadRequestException('No User Found');
    }
    if (
      !/^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(
        user.email,
      )
    ) {
      throw new BadRequestException('Email is invalid!');
    }
    user.email = data.email;

    await this.mailerService.sendMail({
      from: 'hoanghieufro@gmail.com',
      to: user.email,
      subject: 'Change Email!',
      html: `
      <p>If you are not the one who's doing this, please contact us through hoanghieufro@gmail.com to get help!</p>`,
    });
    await Promise.all([
      hSetUser(user._id, { email: user.email }),
      hDeleteUsersHaveRegistered(oldEmail),
      hSetUsersHaveRegistered(user._id, user.email),
    ]);
    return user.save();
  }
}
