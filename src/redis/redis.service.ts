import Redis from 'ioredis';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleInit {
  private client: Redis;

  constructor(private configService: ConfigService) {}

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
}
