import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { LoggingMiddleware } from './logging/logging.middleware';
import { ActivitiesModule } from './activities/activities.module';
import { AttachUserMiddleware } from './attach-user/attach-user.middleware';
import { ScoresModule } from './scores/scores.module';
import { RedisService } from './redis/redis.service';
import { LeaderboardGateway } from './leaderboard/leaderboard.gateway';
import { AuthService } from './auth/auth.service';
import { WebhooksController } from './webhooks/webhooks.controller';

@Module({
  imports: [
    AuthModule,
    ActivitiesModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ScoresModule,
  ],
  controllers: [WebhooksController],
  providers: [
    PrismaService,
    RedisService,
    LeaderboardGateway,
    AuthService,
    JwtService,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware, AttachUserMiddleware).forRoutes('*');
  }
}
