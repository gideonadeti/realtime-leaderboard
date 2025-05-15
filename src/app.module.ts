import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { LoggingMiddleware } from './logging/logging.middleware';
import { ActivitiesModule } from './activities/activities.module';
import { AttachUserMiddleware } from './attach-user/attach-user.middleware';
import { ScoresModule } from './scores/scores.module';
import { RedisService } from './redis/redis.service';

@Module({
  imports: [
    AuthModule,
    ActivitiesModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ScoresModule,
  ],
  controllers: [],
  providers: [PrismaService, RedisService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware, AttachUserMiddleware).forRoutes('*');
  }
}
