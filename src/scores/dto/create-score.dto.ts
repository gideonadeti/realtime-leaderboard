import { IsInt, IsNotEmpty, IsPositive, IsString, Max } from 'class-validator';

export class CreateScoreDto {
  /**
   * Score's value
   * @example 21
   */
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @Max(100)
  value: number;

  /**
   * Score's activity id
   * @example '34130d3a47a4137caa33e19a'
   */
  @IsNotEmpty()
  @IsString()
  activityId: string;
}
