import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';

import { ScoresService } from './scores.service';
import { CreateScoreDto } from './dto/create-score.dto';
import { UpdateScoreDto } from './dto/update-score.dto';
import { UserId } from 'src/user-id/user-id.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ClerkAuthGuard } from 'src/auth/guards/clerk-auth.guard';

@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('scores')
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Post()
  create(@UserId() userId: string, @Body() createScoreDto: CreateScoreDto) {
    return this.scoresService.create(userId, createScoreDto);
  }

  @Get()
  findAll(@UserId() userId: string) {
    return this.scoresService.findAll(userId);
  }

  @Get(':id')
  findOne(@UserId() userId: string, @Param('id') id: string) {
    return this.scoresService.findOne(userId, id);
  }

  @Patch(':id')
  update(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() updateScoreDto: UpdateScoreDto,
  ) {
    return this.scoresService.update(userId, id, updateScoreDto);
  }

  @Delete(':id')
  remove(@UserId() userId: string, @Param('id') id: string) {
    return this.scoresService.remove(userId, id);
  }
}
