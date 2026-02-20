import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { NseReportsService } from './nse-reports.service'
import { ReportQueryDto, NsePassthroughPipe } from '../dto/nmf.dto'

@ApiTags('NSE NMF Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('advisor', 'admin', 'fa_staff')
@Controller('api/v1/nmf/reports')
export class NseReportsController {
  constructor(private reportsService: NseReportsService) {}

  @Post('order-status')
  @ApiOperation({ summary: 'Order status report' })
  async orderStatus(@CurrentUser() user: any, @Body(NsePassthroughPipe) data: ReportQueryDto) {
    return this.reportsService.getReport(user.id, 'order-status', data)
  }

  @Post('allotment')
  @ApiOperation({ summary: 'Allotment statement' })
  async allotment(@CurrentUser() user: any, @Body(NsePassthroughPipe) data: ReportQueryDto) {
    return this.reportsService.getReport(user.id, 'allotment', data)
  }

  @Post('order-lifecycle')
  @ApiOperation({ summary: 'Full order lifecycle' })
  async orderLifecycle(@CurrentUser() user: any, @Body(NsePassthroughPipe) data: ReportQueryDto) {
    return this.reportsService.getReport(user.id, 'order-lifecycle', data)
  }

  @Post('mandate-status')
  @ApiOperation({ summary: 'Mandate status report' })
  async mandateStatus(@CurrentUser() user: any, @Body(NsePassthroughPipe) data: ReportQueryDto) {
    return this.reportsService.getReport(user.id, 'mandate-status', data)
  }

  @Post('sip-registration')
  @ApiOperation({ summary: 'SIP registration report' })
  async sipRegistration(@CurrentUser() user: any, @Body(NsePassthroughPipe) data: ReportQueryDto) {
    return this.reportsService.getReport(user.id, 'sip-registration', data)
  }

  @Post('xsip-registration')
  @ApiOperation({ summary: 'XSIP registration report' })
  async xsipRegistration(@CurrentUser() user: any, @Body(NsePassthroughPipe) data: ReportQueryDto) {
    return this.reportsService.getReport(user.id, 'xsip-registration', data)
  }

  @Post('scheme-master')
  @ApiOperation({ summary: 'Scheme master download' })
  async schemeMaster(@CurrentUser() user: any, @Body(NsePassthroughPipe) data: ReportQueryDto) {
    return this.reportsService.getReport(user.id, 'scheme-master', data)
  }

  @Post(':reportType')
  @ApiOperation({ summary: 'Generic report endpoint' })
  async genericReport(
    @Param('reportType') reportType: string,
    @CurrentUser() user: any,
    @Body(NsePassthroughPipe) data: ReportQueryDto,
  ) {
    return this.reportsService.getReport(user.id, reportType, data)
  }
}
