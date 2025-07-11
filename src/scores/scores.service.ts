import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { CreateScoreDto } from './dto/create-score.dto';
import { UpdateScoreDto } from './dto/update-score.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { LeaderboardGateway } from 'src/leaderboard/leaderboard.gateway';
import { ActivitiesService } from 'src/activities/activities.service';

@Injectable()
export class ScoresService {
  constructor(
    private prismaService: PrismaService,
    private redisService: RedisService,
    private leaderboardGateway: LeaderboardGateway,
    private activitiesService: ActivitiesService,
  ) {}

  private logger = new Logger(ScoresService.name);

  private handleError(error: any, action: string) {
    this.logger.error(`Failed to ${action}`, (error as Error).stack);

    if (error instanceof BadRequestException) {
      throw error;
    }

    throw new InternalServerErrorException(`Failed to ${action}`);
  }
  async create(userId: string, createScoreDto: CreateScoreDto) {
    try {
      const score = await this.prismaService.score.create({
        data: {
          ...createScoreDto,
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      const response = await this.redisService.addScore(
        createScoreDto.activityId,
        userId,
        createScoreDto.value,
      );

      await this.redisService.addScore('global', userId, createScoreDto.value);

      // Get updated leaderboards
      const activityLeaderboard = await this.activitiesService.findLeaderboard(
        createScoreDto.activityId,
      );
      const globalLeaderboard =
        await this.activitiesService.findLeaderboard('global');

      // Emit updated leaderboards
      this.leaderboardGateway.emitToClients(
        `activities:${createScoreDto.activityId}:leaderboard`,
        activityLeaderboard,
      );
      this.leaderboardGateway.emitToClients(
        `activities:global:leaderboard`,
        globalLeaderboard,
      );

      return {
        ...score,
        currentScore: Number(response),
      };
    } catch (error) {
      this.handleError(error, 'create score');
    }
  }

  async findAll(userId: string) {
    try {
      return await this.prismaService.score.findMany({
        where: {
          userId,
        },
      });
    } catch (error) {
      this.handleError(error, `fetch scores for user with id ${userId}`);
    }
  }

  async findOne(userId: string, id: string) {
    try {
      const score = await this.prismaService.score.findUnique({
        where: { id, userId },
      });

      if (!score) {
        throw new BadRequestException(`Score with id ${id} not found`);
      }

      return score;
    } catch (error) {
      this.handleError(error, `fetch score with id ${id}`);
    }
  }

  async update(userId: string, id: string, updateScoreDto: UpdateScoreDto) {
    try {
      return await this.prismaService.score.update({
        where: { id, userId },
        data: updateScoreDto,
      });
    } catch (error) {
      this.handleError(error, `update score with id ${id}`);
    }
  }

  async remove(userId: string, id: string) {
    try {
      return await this.prismaService.score.delete({
        where: { id, userId },
      });
    } catch (error) {
      this.handleError(error, `delete score with id ${id}`);
    }
  }
}
