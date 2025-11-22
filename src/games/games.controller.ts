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

  @Delete(':id')
  remove(@Param('id') id: string, @UserId() playerId: string) {
    return this.gamesService.remove(id, playerId);
  }
}
