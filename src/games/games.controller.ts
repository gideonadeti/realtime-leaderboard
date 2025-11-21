import { ApiBearerAuth } from '@nestjs/swagger';
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
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PlayerRole } from '@prisma/client';

@Controller('games')
@ApiBearerAuth()
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
  @UseGuards(RolesGuard)
  @Roles(PlayerRole.ADMIN)
  rebuildLeaderboards() {
    return this.gamesService.rebuildLeaderboards();
  }
}
