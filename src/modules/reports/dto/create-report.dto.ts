import {
  IsDefined,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ReportOptions, reportType } from '../entities/report.entity';
import { Type } from 'class-transformer';

class reportOptionClass {
  @IsString()
  @IsOptional()
  postId: string;

  @IsString()
  @IsOptional()
  commentId: string;

  @IsString()
  @IsOptional()
  groupId: string;
}

export class CreateReportDto {
  @IsString()
  userId: string;

  @IsString()
  reportType: reportType;

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => reportOptionClass)
  reportOptions: ReportOptions;
}
