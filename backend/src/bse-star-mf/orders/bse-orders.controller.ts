import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { BseOrderService } from './bse-order.service'
import { BseSwitchService } from './bse-switch.service'
import { BseSpreadService } from './bse-spread.service'
import { BseCobService } from './bse-cob.service'
import { PlaceOrderDto, PlaceSwitchDto, PlaceSpreadDto } from './dto/place-order.dto'
import { PlaceCobDto } from './dto/place-cob.dto'
import { BseOrderStatus, BseOrderType } from '@prisma/client'
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface'

@ApiTags('BSE Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('advisor', 'admin', 'fa_staff')
@Controller('api/v1/bse/orders')
export class BseOrdersController {
  constructor(
    private orderService: BseOrderService,
    private switchService: BseSwitchService,
    private spreadService: BseSpreadService,
    private cobService: BseCobService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List BSE orders with filters' })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: BseOrderStatus })
  @ApiQuery({ name: 'orderType', required: false, enum: BseOrderType })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Query('clientId') clientId?: string,
    @Query('status') status?: BseOrderStatus,
    @Query('orderType') orderType?: BseOrderType,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.orderService.listOrders(user.id, {
      clientId,
      status,
      orderType,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    })
  }

  @Post('purchase')
  @ApiOperation({ summary: 'Place a lumpsum purchase order' })
  async placePurchase(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PlaceOrderDto,
  ) {
    return this.orderService.placePurchase(user.id, dto)
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Place a redemption order' })
  async placeRedemption(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PlaceOrderDto,
  ) {
    return this.orderService.placeRedemption(user.id, dto)
  }

  @Post('switch')
  @ApiOperation({ summary: 'Place a switch order' })
  async placeSwitch(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PlaceSwitchDto,
  ) {
    return this.switchService.placeSwitch(user.id, dto)
  }

  @Post('spread')
  @ApiOperation({ summary: 'Place a spread order' })
  async placeSpread(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PlaceSpreadDto,
  ) {
    return this.spreadService.placeSpread(user.id, dto)
  }

  @Post('cob')
  @ApiOperation({ summary: 'Place a Change of Broker (Transfer In) order' })
  async placeCob(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PlaceCobDto,
  ) {
    return this.cobService.placeCob(user.id, dto)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order detail' })
  async getOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.orderService.getOrder(id, user.id)
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  async cancelOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.orderService.cancelOrder(id, user.id)
  }
}
