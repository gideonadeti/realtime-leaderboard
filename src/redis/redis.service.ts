import Redis from 'ioredis';
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GameOutcome } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RedisService implements OnModuleInit {
  private client: Redis;
  private logger = new Logger(RedisService.name);

  constructor(
    private configService: ConfigService,
    private prismaService: PrismaService,
  ) {}

  onModuleInit() {
    const username = this.configService.get<string>('REDIS_USERNAME');
    const password = this.configService.get<string>('REDIS_PASSWORD');
    const host = this.configService.get<string>('REDIS_HOST');
    const port = this.configService.get<number>('REDIS_PORT');

    this.client = new Redis({
      username,
      password,
      host,
      port,
    });
  }

  async updateLeaderboards(
    userId: string,
    duration: number,
    options?: { includeDuration?: boolean },
  ) {
    const tasks: Promise<string | number>[] = [this.incrementGameCount(userId)];

    if (options?.includeDuration ?? true) {
      tasks.push(this.updateBestDuration(userId, duration));
    }

    await Promise.all(tasks);
  }

  /**
   * Increment the game count for a user (for most games played leaderboard)
   */
  async incrementGameCount(userId: string) {
    return this.client.zincrby('leaderboard:games-played', 1, userId);
  }

  /**
   * Update the best duration for a user (for fastest time leaderboard)
   * Only updates if the new duration is lower than the existing one
   */
  async updateBestDuration(userId: string, duration: number) {
    // LT option: only update if new duration is less than existing
    // If user doesn't exist, it will add them
    return this.client.zadd(
      'leaderboard:best-duration',
      'LT',
      duration,
      userId,
    );
  }

  /**
   * Get the most games played leaderboard (descending - highest first)
   */
  async getMostGamesLeaderboard() {
    const response = await this.client.zrevrange(
      'leaderboard:games-played',
      0,
      -1,
      'WITHSCORES',
    );

    const users: { userId: string; count: number }[] = [];

    for (let i = 0; i < response.length; i += 2) {
      users.push({ userId: response[i], count: Number(response[i + 1]) });
    }

    return users;
  }

  /**
   * Get the best duration leaderboard (ascending - lowest first)
   */
  async getBestDurationLeaderboard() {
    const response = await this.client.zrange(
      'leaderboard:best-duration',
      0,
      -1,
      'WITHSCORES',
    );

    const users: { userId: string; duration: number }[] = [];

    for (let i = 0; i < response.length; i += 2) {
      users.push({ userId: response[i], duration: Number(response[i + 1]) });
    }

    return users;
  }

  async removeUser(userId: string) {
    const gamesPlayed = await this.client.zrem(
      'leaderboard:games-played',
      userId,
    );

    const bestDuration = await this.client.zrem(
      'leaderboard:best-duration',
      userId,
    );

    return { gamesPlayed, bestDuration };
  }

  /**
   * Set exact game count for a user (for sync operations)
   */
  async setGameCount(userId: string, count: number) {
    if (count <= 0) {
      return this.client.zrem('leaderboard:games-played', userId);
    }

    return this.client.zadd('leaderboard:games-played', count, userId);
  }

  /**
   * Set exact best duration for a user (for sync operations)
   */
  async setBestDuration(userId: string, duration: number) {
    return this.client.zadd('leaderboard:best-duration', duration, userId);
  }

  /**
   * Clear all leaderboard data (for rebuild operations)
   */
  async clearLeaderboards() {
    await Promise.all([
      this.client.del('leaderboard:games-played'),
      this.client.del('leaderboard:best-duration'),
    ]);
  }

  /**
   * Rebuild Redis leaderboards from database when things go wrong
   */
  async rebuildFromDatabase() {
    this.logger.log('Rebuilding Redis leaderboards from database...');

    // Clear Redis first
    await this.clearLeaderboards();

    // Get all players and their games
    const players = await this.prismaService.player.findMany({
      include: { games: true },
    });

    let processed = 0;

    for (const player of players) {
      // Count total games
      const totalGames = player.games.length;

      if (totalGames > 0) {
        await this.setGameCount(player.id, totalGames);
      }

      // Find best duration from wins only
      const wins = player.games.filter((g) => g.outcome === GameOutcome.WON);

      if (wins.length > 0) {
        const bestTime = Math.min(...wins.map((g) => g.duration));

        await this.setBestDuration(player.id, bestTime);
      }

      processed++;
    }

    this.logger.log(`Rebuilt leaderboards for ${processed} players`);
  }
}
