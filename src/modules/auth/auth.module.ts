import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/modules/users/entities/User.entity';
import { JwtStrategy } from './Passport/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtGuards } from './Passport/jwt.guards';
import { JwtModule } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bull';
import { UsersModule } from 'src/modules/users/users.module';
import { DeSerializeInRedisModule } from 'src/modules/de-serialize-in-redis/de-serialize-in-redis.module';
import { FriendsModule } from 'src/modules/friends/friends.module';
import { GroupsJoinedModule } from 'src/modules/groups-joined/groups-joined.module';
import { ChatSystemModule } from 'src/modules/chat-system/chat-system.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtGuards],
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '60h' },
    }),
    BullModule.registerQueue(
      {
        name: 'resize-images',
      },
      {
        name: 'sending-mail',
      },
    ),
    forwardRef(() => UsersModule),
    DeSerializeInRedisModule,
    FriendsModule,
    GroupsJoinedModule,
    ChatSystemModule,
  ],
  exports: [JwtGuards, AuthService],
})
export class AuthModule {}
