import {
  ReportOptions,
  reportType,
} from 'src/modules/reports/entities/report.entity';

export function CheckReportType(
  reportType: reportType,
  reportOptions: ReportOptions,
) {
  let reportTitle = '';
  let reportName = 'group';
  if (reportOptions.postId) {
    reportName = 'post';
  }
  if (reportOptions.commentId) {
    reportName = 'comment';
  }
  reportTitle = `this ${reportName} has ${reportType} in its content`;
  return reportTitle;
}
