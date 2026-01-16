import { Module, forwardRef } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Friend, FriendSchema } from './entities/friend.entity';
import { UsersModule } from 'src/modules/users/users.module';
import { NotificationModule } from 'src/modules/notification/notification.module';
import { ChatSystemModule } from 'src/modules/chat-system/chat-system.module';

@Module({
  controllers: [FriendsController],
  providers: [FriendsService],
  imports: [
    MongooseModule.forFeature([{ name: Friend.name, schema: FriendSchema }]),
    NotificationModule,
    forwardRef(() => UsersModule),
    ChatSystemModule,
  ],
  exports: [FriendsService],
})
export class FriendsModule {}
