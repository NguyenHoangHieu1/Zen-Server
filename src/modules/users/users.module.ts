import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './entities/User.entity';
import { NotificationModule } from 'src/modules/notification/notification.module';
import { FriendsModule } from 'src/modules/friends/friends.module';
import { PostsModule } from 'src/modules/posts/posts.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { UsersGateWay } from './users.gateway';
import { Friend, FriendSchema } from './entities/Friend.entity';
import { DeSerializeInRedisModule } from '../de-serialize-in-redis/de-serialize-in-redis.module';
import { SupabaseStorageService } from 'src/common/services/supabase-storage.service';
@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersGateWay, SupabaseStorageService],
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Friend.name, schema: FriendSchema },
    ]),
    NotificationModule,
    forwardRef(() => FriendsModule),
    forwardRef(() => PostsModule),
    forwardRef(() => AuthModule),
    DeSerializeInRedisModule,
  ],
  exports: [UsersService],
})
export class UsersModule {}
