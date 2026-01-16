import { Module } from '@nestjs/common';
import { PostsRedisService } from './posts.redis.service';
import { UsersRedisService } from './users.redis.service';
import { PostsModule } from 'src/modules/posts/posts.module';
import { UsersModule } from 'src/modules/users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from 'src/modules/posts/entities/post.entity';
import { User, UserSchema } from 'src/modules/users/entities/User.entity';
@Module({
  providers: [PostsRedisService, UsersRedisService],
  imports: [
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  exports: [PostsRedisService, UsersRedisService],
})
export class DeSerializeInRedisModule {}
