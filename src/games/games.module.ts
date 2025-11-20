import { Module } from '@nestjs/common';

import { GamesService } from './games.service';
import { GamesController } from './games.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { LeaderboardGateway } from 'src/leaderboard/leaderboard.gateway';

@Module({
  controllers: [GamesController],
  providers: [GamesService, PrismaService, RedisService, LeaderboardGateway],
})
export class GamesModule {}
