import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { CreateGameDto } from './dto/create-game.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GamesService {
  constructor(private prismaService: PrismaService) {}

  private logger = new Logger(GamesService.name);

  private handleError(error: any, action: string) {
    this.logger.error(`Failed to ${action}`, (error as Error).stack);

    if (error instanceof NotFoundException) {
      throw error;
    }

    throw new InternalServerErrorException(`Failed to ${action}`);
  }

  async create(createGameDto: CreateGameDto, playerId: string) {
    try {
      return await this.prismaService.game.create({
        data: {
          playerId,
          ...createGameDto,
        },
      });
    } catch (error) {
      this.handleError(error, 'create game');
    }
  }

  async findAll(playerId: string) {
    try {
      const games = await this.prismaService.game.findMany({
        where: { playerId },
        orderBy: { createdAt: 'desc' },
      });

      return games;
    } catch (error) {
      this.handleError(error, 'fetch games');
    }
  }

  async remove(id: string, playerId: string) {
    try {
      // First check if the game exists and belongs to the player
      const game = await this.prismaService.game.findUnique({
        where: { id, playerId },
      });

      if (!game) {
        throw new NotFoundException(
          `Game with ID ${id} not found for player with ID ${playerId}`,
        );
      }

      await this.prismaService.game.delete({
        where: { id, playerId },
      });

      return { message: 'Game deleted successfully' };
    } catch (error) {
      this.handleError(error, 'delete game');
    }
  }
}
