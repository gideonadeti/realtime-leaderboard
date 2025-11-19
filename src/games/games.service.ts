import { Injectable } from '@nestjs/common';
import { CreateGameDto } from './dto/create-game.dto';

@Injectable()
export class GamesService {
  create(createGameDto: CreateGameDto) {
    return 'This action adds a new game';
  }

  findAll() {
    return `This action returns all games`;
  }

  remove(id: string) {
    return `This action removes a #${id} game`;
  }
}
