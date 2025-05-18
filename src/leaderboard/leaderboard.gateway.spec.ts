import { Test, TestingModule } from '@nestjs/testing';
import { LeaderboardGateway } from './leaderboard.gateway';

describe('LeaderboardGateway', () => {
  let gateway: LeaderboardGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LeaderboardGateway],
    }).compile();

    gateway = module.get<LeaderboardGateway>(LeaderboardGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
