import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { BseReportsService } from './bse-reports.service'
import { BseChildOrdersService } from './bse-child-orders.service'
import { OrderStatusQueryDto, AllotmentQueryDto, RedemptionQueryDto } from './dto/report-query.dto'

@ApiTags('BSE Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('advisor', 'admin', 'fa_staff')
@Controller('api/v1/bse/reports')
export class BseReportsController {
  constructor(
    private reportsService: BseReportsService,
    private childOrdersService: BseChildOrdersService,
  ) {}

  @Post('order-status')
  @ApiOperation({ summary: 'Query order status report' })
  async queryOrderStatus(@CurrentUser() user: any, @Body() dto: OrderStatusQueryDto) {
    return this.reportsService.queryOrderStatus(user.id, dto)
  }

  @Post('allotment')
  @ApiOperation({ summary: 'Query allotment statement' })
  async queryAllotment(@CurrentUser() user: any, @Body() dto: AllotmentQueryDto) {
    return this.reportsService.queryAllotmentStatement(user.id, dto)
  }

  @Post('redemption')
  @ApiOperation({ summary: 'Query redemption statement' })
  async queryRedemption(@CurrentUser() user: any, @Body() dto: RedemptionQueryDto) {
    return this.reportsService.queryRedemptionStatement(user.id, dto)
  }

  @Get('child-orders/:regnNo')
  @ApiOperation({ summary: 'Get child order details for SIP/XSIP/STP/SWP' })
  async getChildOrders(@CurrentUser() user: any, @Param('regnNo') regnNo: string) {
    return this.childOrdersService.getChildOrderDetails(user.id, regnNo)
  }
}
