import { Module } from '@nestjs/common';

import { ScoresService } from './scores.service';
import { ScoresController } from './scores.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

@Module({
  controllers: [ScoresController],
  providers: [ScoresService, PrismaService, RedisService],
})
export class ScoresModule {}
