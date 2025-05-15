import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateScoreDto {
  /**
   * Score's value
   * @example 21
   */
  @IsInt()
  @IsNotEmpty()
  value: number;

  /**
   * Score's activity id
   * @example '34130d3a47a4137caa33e19a'
   */
  @IsString()
  @IsNotEmpty()
  activityId: string;
}
