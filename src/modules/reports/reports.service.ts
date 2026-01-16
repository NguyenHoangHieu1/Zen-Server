import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { UserId } from 'src/common/types/User';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { Report } from './entities/report.entity';
import { CheckReportType } from 'src/common/utils/CheckReportType';
import { OptionSearchDto } from 'src/cores/globalDtos/optionsSearch.dto';
import { ReportId } from 'src/common/types/Report';
@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name)
    private readonly reportModel: Model<Report>,
    private readonly usersService: UsersService,
  ) {}

  async setStatusReport(userId: UserId, reportId: ReportId, status: string) {
    const user = await this.usersService.findUser(userId);
    if (!user.isAdmin) {
      throw new UnauthorizedException('You are not the admin to set this!');
    }
    const report = await this.reportModel.findByIdAndUpdate(reportId, {
      $set: { status },
    });
    return report;
  }
  /**
   * Get all reports for admin
   * */
  async getReports(optionSearchDto: OptionSearchDto) {
    const reportsCount = await this.reportModel.countDocuments();
    const reports = await this.reportModel.aggregate([
      {
        $match: { status: { $eq: 'PENDING' } },
      },
      {
        $limit: optionSearchDto.limit,
      },
      {
        $skip: optionSearchDto.skip,
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userIdReport',
          foreignField: '_id',
          as: 'userReport',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userIdReported',
          foreignField: '_id',
          as: 'userReported',
        },
      },
      {
        $addFields: {
          userReport: { $first: '$userReport' },
        },
      },
      {
        $addFields: {
          userReported: { $first: '$userReported' },
        },
      },
      {
        $project: {
          _id: 1,
          reportType: 1,
          reportTitle: 1,
          reportBody: 1,
          userReport: {
            username: 1,
            avatar: 1,
            _id: 1,
            email: 1,
          },
          userReported: {
            username: 1,
            avatar: 1,
            _id: 1,
            email: 1,
          },
          options: 1,
          createdAt: 1,
        },
      },
    ]);
    return { reports, reportsCount };
  }

  /**
   *
   * Needsm userIdReport and userIdReported simply because we need
   * to know who reported to who. there are some options that we need
   * to define what kind of report it is so that the admin can have an easier time deciding
   * what to do.
   * @param userIdReport
   * @param userIdReported
   * @param options
   */
  async createReport(
    userIdReport: UserId,
    userIdReported: UserId,
    options: CreateReportDto,
  ) {
    console.log('options:', options);
    const reportTitle = CheckReportType(
      options.reportType,
      options.reportOptions,
    );
    await this.reportModel.create({
      userIdReported,
      userIdReport,
      reportTitle,
      reportType: options.reportType,
      options: options.reportOptions,
      reportBody: 'you can ban, warn or restrict them!',
    });
  }
  /**
   * User - Admin
   * Be able to read the reports and decide the fate of the user
   * */
  async decideReport(
    userAdminId: UserId,
    userReportedId: UserId,
    reportAction: 'ban' | 'warning' | 'restrict',
  ) {}
}
