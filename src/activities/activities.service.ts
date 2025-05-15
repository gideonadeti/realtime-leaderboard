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

@Injectable()
export class ActivitiesService {
  constructor(private prismaService: PrismaService) {}

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

  findAll() {
    return `This action returns all activities`;
  }

  findOne(id: number) {
    return `This action returns a #${id} activity`;
  }

  update(id: number, updateActivityDto: UpdateActivityDto) {
    return `This action updates a #${id} activity`;
  }

  remove(id: number) {
    return `This action removes a #${id} activity`;
  }
}
