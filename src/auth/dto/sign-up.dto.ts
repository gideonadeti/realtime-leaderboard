import { IsNotEmpty, IsString } from 'class-validator';

export class SignUpDto {
  /**
   * Player's username
   * @example johndoe
   */
  @IsString()
  @IsNotEmpty()
  username: string;

  /**
   * Player's password
   * @example strongPassword
   */
  @IsString()
  @IsNotEmpty()
  password: string;
}
