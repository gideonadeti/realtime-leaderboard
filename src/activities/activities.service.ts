import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'generated/prisma';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class ActivitiesService {
  constructor(
    private prismaService: PrismaService,
    private redisService: RedisService,
  ) {}

  private logger = new Logger(ActivitiesService.name);

  private handleError(error: any, action: string) {
    this.logger.error(`Failed to ${action}`, (error as Error).stack);

    if (error instanceof BadRequestException) {
      throw error;
    } else if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Activity already exists');
    }

    throw new InternalServerErrorException(`Failed to ${action}`);
  }

  async create(userId: string, createActivityDto: CreateActivityDto) {
    try {
      return await this.prismaService.activity.create({
        data: {
          ...createActivityDto,
          adminId: userId,
        },
      });
    } catch (error) {
      this.handleError(error, 'create activity');
    }
  }

  async findAll() {
    try {
      return await this.prismaService.activity.findMany({
        include: {
          scores: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      this.handleError(error, 'fetch activities');
    }
  }

  async findOne(id: string) {
    try {
      const activity = await this.prismaService.activity.findUnique({
        where: { id },
      });

      if (!activity) {
        throw new BadRequestException(`Activity with id ${id} not found`);
      }

      return activity;
    } catch (error) {
      this.handleError(error, `fetch activity with id ${id}`);
    }
  }

  async findLeaderboard(id: string) {
    try {
      const topUsers = await this.redisService.getTopUsers(id);
      const users = await Promise.all(
        topUsers.map(async ({ userId, score }) => {
          const user = await this.prismaService.user.findUnique({
            where: { id: userId },
          });

          return {
            id: userId,
            name: user?.name ?? 'Anonymous',
            score,
            rank: topUsers.indexOf({ userId, score }) + 1,
          };
        }),
      );

      return users;
    } catch (error) {
      this.handleError(error, `fetch leaderboard for activity with id ${id}`);
    }
  }

  async update(
    userId: string,
    id: string,
    updateActivityDto: UpdateActivityDto,
  ) {
    try {
      return await this.prismaService.activity.update({
        where: { id, adminId: userId },
        data: updateActivityDto,
      });
    } catch (error) {
      this.handleError(error, `update activity with id ${id}`);
    }
  }

  async remove(userId: string, id: string) {
    try {
      return await this.prismaService.activity.delete({
        where: { id, adminId: userId },
      });
    } catch (error) {
      this.handleError(error, `delete activity with id ${id}`);
    }
  }
}
