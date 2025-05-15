import { IsNotEmpty, IsString } from 'class-validator';

export class CreateActivityDto {
  /**
   * Activity's name
   * @example "Running"
   */
  @IsString()
  @IsNotEmpty()
  name: string;
}
