import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';

import { GamesService } from './games.service';
import { CreateGameDto } from './dto/create-game.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserId } from 'src/user-id/user-id.decorator';
import { Public } from 'src/auth/public.decorator';

@Controller('games')
@UseGuards(JwtAuthGuard)
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post()
  create(@Body() createGameDto: CreateGameDto, @UserId() playerId: string) {
    return this.gamesService.create(createGameDto, playerId);
  }

  @Get()
  findAll(@UserId() playerId: string) {
    return this.gamesService.findAll(playerId);
  }

  @Get('leaderboard/duration')
  @Public()
  findDurationLeaderboard() {
    return this.gamesService.findDurationLeaderboard();
  }

  @Get('leaderboard/games-played')
  @Public()
  findMostGamesLeaderboard() {
    return this.gamesService.findMostGamesLeaderboard();
  }

  @Delete(':id')
  remove(@Param('id') id: string, @UserId() playerId: string) {
    return this.gamesService.remove(id, playerId);
  }

  @Post('rebuild-leaderboards')
  rebuildLeaderboards() {
    return this.gamesService.rebuildLeaderboards();
  }
}
