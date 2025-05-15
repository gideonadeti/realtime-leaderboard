import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { CreateScoreDto } from './dto/create-score.dto';
import { UpdateScoreDto } from './dto/update-score.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ScoresService {
  constructor(private prismaService: PrismaService) {}

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
      return await this.prismaService.score.create({
        data: {
          ...createScoreDto,
          userId,
        },
      });
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

  findOne(id: number) {
    return `This action returns a #${id} score`;
  }

  update(id: number, updateScoreDto: UpdateScoreDto) {
    return `This action updates a #${id} score`;
  }

  remove(id: number) {
    return `This action removes a #${id} score`;
  }
}
