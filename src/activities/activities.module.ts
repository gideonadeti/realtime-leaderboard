import { Module } from '@nestjs/common';

import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

@Module({
  controllers: [ActivitiesController],
  providers: [ActivitiesService, PrismaService, RedisService],
})
export class ActivitiesModule {}
