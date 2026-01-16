import { Module, forwardRef } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Group, groupSchema } from './entities/group.entity';
import { PostsModule } from 'src/modules/posts/posts.module';
import { GroupsJoinedModule } from 'src/modules/groups-joined/groups-joined.module';
import { Post, PostSchema } from 'src/modules/posts/entities/post.entity';
import { DeSerializeInRedisModule } from 'src/modules/de-serialize-in-redis/de-serialize-in-redis.module';
import { SupabaseStorageService } from 'src/common/services/supabase-storage.service';

@Module({
  controllers: [GroupsController],
  providers: [GroupsService, SupabaseStorageService],
  imports: [
    MongooseModule.forFeature([
      { name: Group.name, schema: groupSchema },
      { name: Post.name, schema: PostSchema },
    ]),
    forwardRef(() => PostsModule),
    GroupsJoinedModule,
    DeSerializeInRedisModule,
  ],
  exports: [GroupsService],
})
export class GroupsModule {}
