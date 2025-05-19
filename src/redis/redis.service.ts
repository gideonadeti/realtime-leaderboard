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

  async addScore(activityId: string, userId: string, value: number) {
    return this.client.zincrby(activityId, value, userId);
  }

  async getTopUsers(activityId: string) {
    const response = await this.client.zrevrange(
      activityId,
      0,
      -1,
      'WITHSCORES',
    );
    const users: { userId: string; score: number }[] = [];

    for (let i = 0; i < response.length; i += 2) {
      users.push({ userId: response[i], score: Number(response[i + 1]) });
    }

    return users;
  }

  async removeUser(activityId: string, userId: string) {
    return this.client.zrem(activityId, userId);
  }
}
