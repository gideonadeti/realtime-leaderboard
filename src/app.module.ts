import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { LoggingMiddleware } from './logging/logging.middleware';
import { RedisService } from './redis/redis.service';
import { LeaderboardGateway } from './leaderboard/leaderboard.gateway';
import { AuthService } from './auth/auth.service';

@Module({
  imports: [AuthModule, ConfigModule.forRoot({ isGlobal: true })],
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
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
