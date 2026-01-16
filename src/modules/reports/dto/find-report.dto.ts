import { IsString } from 'class-validator';

export class FindReportDto {
  @IsString()
  reportId: string;
}
