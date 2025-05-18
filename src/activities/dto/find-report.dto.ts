import { IsNotEmpty, IsDate } from 'class-validator';

export class FindReportDto {
  /**
   * Report's from date
   * @example 2023-01-01T00:00:00.000Z
   */
  @IsNotEmpty()
  @IsDate()
  fromDate: Date;

  /**
   * Report's to date
   * @example 2025-01-01T00:00:00.000Z
   */
  @IsNotEmpty()
  @IsDate()
  toDate: Date;
}
