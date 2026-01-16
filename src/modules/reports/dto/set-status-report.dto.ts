import { IsString } from 'class-validator';
import { FindReportDto } from './find-report.dto';

export class SetStatusReportDto extends FindReportDto {
  @IsString()
  status: string;
}
