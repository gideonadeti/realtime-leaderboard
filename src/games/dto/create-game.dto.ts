import { IsEnum, IsInt, IsNotEmpty, Min } from 'class-validator';
import { GameOutcome } from '@prisma/client';

export class CreateGameDto {
  /**
   * Game duration in seconds
   * @example 300
   */
  @IsInt()
  @IsNotEmpty()
  @Min(0)
  duration: number;

  /**
   * Game outcome
   * @example WON
   */
  @IsEnum(GameOutcome)
  @IsNotEmpty()
  outcome: GameOutcome;
}
