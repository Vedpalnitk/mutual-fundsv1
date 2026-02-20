import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { NseOrderService } from './nse-order.service'
import { NseSwitchService } from './nse-switch.service'
import {
  PlacePurchaseOrderDto,
  PlaceRedemptionDto,
  PlaceSwitchOrderDto,
} from '../dto/nmf.dto'

@ApiTags('NSE NMF Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('advisor', 'admin', 'fa_staff')
@Controller('api/v1/nmf/orders')
export class NseOrdersController {
  constructor(
    private orderService: NseOrderService,
    private switchService: NseSwitchService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List NSE orders' })
  async list(
    @CurrentUser() user: any,
    @Query('clientId') clientId?: string,
    @Query('status') status?: string,
    @Query('orderType') orderType?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.orderService.listOrders(user.id, {
      clientId,
      status,
      orderType,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    })
  }

  @Post('purchase')
  @ApiOperation({ summary: 'Place purchase order' })
  async purchase(@CurrentUser() user: any, @Body() data: PlacePurchaseOrderDto) {
    return this.orderService.placePurchase(user.id, data)
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Place redemption order' })
  async redeem(@CurrentUser() user: any, @Body() data: PlaceRedemptionDto) {
    return this.orderService.placeRedemption(user.id, data)
  }

  @Post('switch')
  @ApiOperation({ summary: 'Place switch order' })
  async switchOrder(@CurrentUser() user: any, @Body() data: PlaceSwitchOrderDto) {
    return this.switchService.placeSwitch(user.id, data)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order detail' })
  async getOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.orderService.getOrder(id, user.id)
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  async cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.orderService.cancelOrder(id, user.id)
  }
}
