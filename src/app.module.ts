import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PostsModule } from './modules/posts/posts.module';
import { GroupsModule } from './modules/groups/groups.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { RedisClientOptions } from 'redis';
import { DeSerializeInRedisModule } from './modules/de-serialize-in-redis/de-serialize-in-redis.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AuthorizationMiddleware } from 'src/cores/middlewares/authorization.middleware';
import { FriendsModule } from './modules/friends/friends.module';
import { GroupsJoinedModule } from './modules/groups-joined/groups-joined.module';
import { ChatSystemModule } from './modules/chat-system/chat-system.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { ConversationGroupsModule } from './modules/conversation-groups/conversation-groups.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // LoggerModule.forRoot({
    //
    //   // pinoHttp: {
    //   //   transport: {
    //   //     target: 'pino-pretty',
    //   //     options: {
    //   //       // singleLine: true,
    //   //     },
    //   //   },
    //   // },
    // }),
    MongooseModule.forRoot(process.env.DB_URL, {
      dbName: process.env.DB_NAME,
      appName: process.env.DB_NAME,
    }),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          transport: {
            service: 'gmail',
            auth: {
              user: configService.get<string>('MAILER_USERNAME'),
              pass: configService.get<string>('MAILER_PASSWORD'),
            },
          },
        };
      },
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.CLOUD_REDIS_HOST,
        port: +process.env.CLOUD_REDIS_PORT,
        password: process.env.CLOUD_REDIS_PASSWORD,
      },
    }),
    CacheModule.register<RedisClientOptions>({
      isGlobal: true,
      store: redisStore,
      url: `redis://:${process.env.CLOUD_REDIS_PASSWORD}@${process.env.CLOUD_REDIS_HOST}:${process.env.CLOUD_REDIS_PORT}`,
    }),
    UsersModule,
    AuthModule,
    PostsModule,
    GroupsModule,
    DeSerializeInRedisModule,
    NotificationModule,
    FriendsModule,
    GroupsJoinedModule,
    ChatSystemModule,
    ConversationsModule,
    ConversationGroupsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthorizationMiddleware).forRoutes('*');
  }
}
