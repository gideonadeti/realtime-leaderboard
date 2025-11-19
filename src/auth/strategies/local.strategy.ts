import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  private logger = new Logger(AuthService.name);

  async validate(username: string, password: string) {
    try {
      const player = await this.authService.validatePlayer(username, password);

      if (!player) {
        throw new UnauthorizedException('Invalid username or password');
      }

      return player;
    } catch (error) {
      this.logger.error('Failed to validate player', (error as Error).stack);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to validate player');
    }
  }
}
