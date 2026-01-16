import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtGuards } from '../auth/Passport/jwt.guards';
import { convertToMongoId } from 'src/common/utils/ConvertToMongoId';
import { UserId } from 'src/common/types/User';
import { CreateReportDto } from './dto/create-report.dto';
import { OptionSearchDto } from 'src/cores/globalDtos/optionsSearch.dto';
import { SetStatusReportDto } from './dto/set-status-report.dto';
import { ReportId } from 'src/common/types/Report';

@Controller('reports')
@UseGuards(JwtGuards)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Patch()
  setReportStatus(@Req() req: jwtReq, @Body() data: SetStatusReportDto) {
    const userId = convertToMongoId<UserId>(req.user._id);
    const reportId = convertToMongoId<ReportId>(data.reportId);
    return this.reportsService.setStatusReport(userId, reportId, data.status);
  }

  @Get()
  async getReports(@Query() optionSearchDto: OptionSearchDto) {
    return this.reportsService.getReports(optionSearchDto);
  }

  @Post()
  async createReport(
    @Req() req: jwtReq,
    @Body()
    data: CreateReportDto,
  ) {
    const userReportId = convertToMongoId<UserId>(req.user._id);
    const userReportedId = convertToMongoId<UserId>(data.userId);
    await this.reportsService.createReport(userReportId, userReportedId, data);
  }
}
