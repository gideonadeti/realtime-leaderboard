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

  /**
   * Helper method to build duration leaderboard players from Redis data
   */
  private async buildDurationLeaderboardPlayers(
    leaderboardData: { userId: string; duration: number }[],
  ) {
    const players = await Promise.all(
      leaderboardData.map(async ({ userId, duration }, index) => {
        const player = await this.prismaService.player.findUnique({
          where: { id: userId },
        });

        return player
          ? {
              id: player.id,
              username: player.username,
              bestDuration: duration,
              rank: index + 1,
            }
          : null;
      }),
    );

    return players.filter(Boolean);
  }

  /**
   * Helper method to build games played leaderboard players from Redis data
   */
  private async buildGamesPlayedLeaderboardPlayers(
    leaderboardData: { userId: string; count: number }[],
  ) {
    const players = await Promise.all(
      leaderboardData.map(async ({ userId, count }, index) => {
        const player = await this.prismaService.player.findUnique({
          where: { id: userId },
        });

        return player
          ? {
              id: player.id,
              username: player.username,
              gamesPlayed: count,
              rank: index + 1,
            }
          : null;
      }),
    );

    return players.filter(Boolean);
  }

  /**
   * Helper method to safely execute Redis operations with error handling
   */
  private async safeRedisOperation<T>(
    operation: () => Promise<T>,
    context: string,
  ) {
    try {
      return await operation();
    } catch (error) {
      this.logger.error(
        `Redis operation failed: ${context}`,
        (error as Error).stack,
      );

      return null;
    }
  }

  /**
   * Helper method to emit updated leaderboards to all clients
   */
  private async emitUpdatedLeaderboards(
    options: { emitGamesPlayed?: boolean; emitDuration?: boolean } = {},
  ) {
    const { emitGamesPlayed = true, emitDuration = false } = options;

    if (emitGamesPlayed) {
      const mostGamesLeaderboard =
        await this.redisService.getMostGamesLeaderboard();

      const mostGamesPlayers =
        await this.buildGamesPlayedLeaderboardPlayers(mostGamesLeaderboard);

      this.leaderboardGateway.emitToClients(
        'leaderboard:games-played',
        mostGamesPlayers,
      );
    }

    if (emitDuration) {
      const bestDurationLeaderboard =
        await this.redisService.getBestDurationLeaderboard();

      const durationPlayers = await this.buildDurationLeaderboardPlayers(
        bestDurationLeaderboard,
      );

      this.leaderboardGateway.emitToClients(
        'leaderboard:duration',
        durationPlayers,
      );
    }
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

      await this.safeRedisOperation(
        () =>
          this.redisService.updateLeaderboards(playerId, game.duration, {
            includeDuration,
          }),
        `game creation for game ${game.id}, player ${playerId}`,
      );

      // Emit updated leaderboards
      await this.emitUpdatedLeaderboards({
        emitGamesPlayed: true,
        emitDuration: includeDuration,
      });

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

      // Delete the game from database
      await this.prismaService.game.delete({
        where: { id, playerId },
      });

      // Update Redis leaderboards
      await this.safeRedisOperation(
        () => this.redisService.decrementGameCount(playerId),
        `decrementing game count for player ${playerId}`,
      );

      // If it was a win, recalculate best duration
      if (game.outcome === GameOutcome.WON) {
        await this.safeRedisOperation(
          () => this.redisService.recalculateBestDuration(playerId),
          `recalculating best duration for player ${playerId}`,
        );
      }

      // Emit updated leaderboards to all clients
      await this.emitUpdatedLeaderboards({
        emitGamesPlayed: true,
        emitDuration: game.outcome === GameOutcome.WON,
      });

      return { message: 'Game deleted successfully' };
    } catch (error) {
      this.handleError(error, 'delete game');
    }
  }

  async findDurationLeaderboard() {
    try {
      const leaderboard = await this.redisService.getBestDurationLeaderboard();
      return this.buildDurationLeaderboardPlayers(leaderboard);
    } catch (error) {
      this.handleError(error, 'fetch duration leaderboard');
    }
  }

  async findMostGamesLeaderboard() {
    try {
      const leaderboard = await this.redisService.getMostGamesLeaderboard();
      return this.buildGamesPlayedLeaderboardPlayers(leaderboard);
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
