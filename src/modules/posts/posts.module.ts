import {
  MiddlewareConsumer,
  Module,
  NestModule,
  forwardRef,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from './entities/post.entity';
import { UsersModule } from '../users/users.module';
import { DeSerializeInRedisModule } from 'src/modules/de-serialize-in-redis/de-serialize-in-redis.module';
import { GroupsModule } from 'src/modules/groups/groups.module';
import { NotificationModule } from 'src/modules/notification/notification.module';
import { SupabaseStorageService } from 'src/common/services/supabase-storage.service';
@Module({
  controllers: [PostsController],
  providers: [PostsService, SupabaseStorageService],
  imports: [
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    forwardRef(() => UsersModule),
    DeSerializeInRedisModule,
    forwardRef(() => GroupsModule),
    NotificationModule,
  ],
  exports: [PostsService],
})
export class PostsModule {}
