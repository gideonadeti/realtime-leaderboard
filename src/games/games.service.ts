import { GameOutcome } from '@prisma/client';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { CreateGameDto } from './dto/create-game.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { LeaderboardGateway } from 'src/leaderboard/leaderboard.gateway';

@Injectable()
export class GamesService {
  constructor(
    private prismaService: PrismaService,
    private redisService: RedisService,
    private leaderboardGateway: LeaderboardGateway,
  ) {}

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
      const game = await this.prismaService.game.create({
        data: {
          playerId,
          ...createGameDto,
        },
      });

      // Update the leaderboards (only include wins in best duration)
      const includeDuration = game.outcome === GameOutcome.WON;

      try {
        await this.redisService.updateLeaderboards(playerId, game.duration, {
          includeDuration,
        });
      } catch (redisError) {
        this.logger.error(
          `Redis update failed for game ${game.id}, player ${playerId}`,
          (redisError as Error).stack,
        );
        // Don't throw - game is already saved to DB
        // Consider implementing a retry mechanism or dead letter queue here
      }

      // Get the updated most games leaderboard
      const mostGamesLeaderboard =
        await this.redisService.getMostGamesLeaderboard();

      // Get the updated best duration leaderboard
      const bestDurationLeaderboard = includeDuration
        ? await this.redisService.getBestDurationLeaderboard()
        : [];

      const durationLeaderboardPlayers = await Promise.all(
        bestDurationLeaderboard.map(async ({ userId, duration }, index) => {
          const player = await this.prismaService.player.findUnique({
            where: { id: userId },
          });

          if (!player) {
            return null;
          }

          return {
            id: player.id,
            username: player.username,
            duration,
            rank: index + 1,
          };
        }),
      );

      if (includeDuration) {
        this.leaderboardGateway.emitToClients(
          'leaderboard:duration',
          durationLeaderboardPlayers,
        );
      }

      const mostGamesLeaderboardPlayers = await Promise.all(
        mostGamesLeaderboard.map(async ({ userId, count }, index) => {
          const player = await this.prismaService.player.findUnique({
            where: { id: userId },
          });

          if (!player) {
            return null;
          }

          return {
            id: player.id,
            username: player.username,
            gamesCount: count,
            rank: index + 1,
          };
        }),
      );

      this.leaderboardGateway.emitToClients(
        'leaderboard:games-played',
        mostGamesLeaderboardPlayers,
      );

      return game;
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

  async findDurationLeaderboard() {
    try {
      const leaderboard = await this.redisService.getBestDurationLeaderboard();
      const players = await Promise.all(
        leaderboard.map(async ({ userId, duration }, index) => {
          const player = await this.prismaService.player.findUnique({
            where: { id: userId },
          });

          if (!player) {
            return null;
          }

          return {
            id: player.id,
            username: player.username,
            duration,
            rank: index + 1,
          };
        }),
      );

      return players;
    } catch (error) {
      this.handleError(error, 'fetch duration leaderboard');
    }
  }

  async findMostGamesLeaderboard() {
    try {
      const leaderboard = await this.redisService.getMostGamesLeaderboard();
      const players = await Promise.all(
        leaderboard.map(async ({ userId, count }, index) => {
          const player = await this.prismaService.player.findUnique({
            where: { id: userId },
          });

          if (!player) {
            return null;
          }

          return {
            id: player.id,
            username: player.username,
            gamesCount: count,
            rank: index + 1,
          };
        }),
      );

      return players;
    } catch (error) {
      this.handleError(error, 'fetch most games leaderboard');
    }
  }

  async rebuildLeaderboards() {
    try {
      await this.redisService.rebuildFromDatabase();

      return { message: 'Leaderboards rebuilt successfully' };
    } catch (error) {
      this.handleError(error, 'rebuild leaderboards');
    }
  }
}
