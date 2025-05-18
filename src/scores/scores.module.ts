import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { ScoresService } from './scores.service';
import { ScoresController } from './scores.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { LeaderboardGateway } from 'src/leaderboard/leaderboard.gateway';
import { ActivitiesService } from 'src/activities/activities.service';
import { AuthService } from 'src/auth/auth.service';

@Module({
  controllers: [ScoresController],
  providers: [
    ScoresService,
    PrismaService,
    RedisService,
    LeaderboardGateway,
    ActivitiesService,
    AuthService,
    JwtService,
  ],
})
export class ScoresModule {}
