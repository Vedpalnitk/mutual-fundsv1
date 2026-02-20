import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { CallbackSignatureGuard, CallbackSecret } from '../../common/guards/callback-signature.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { Public } from '../../common/decorators/public.decorator'
import { NsePaymentService } from './nse-payment.service'
import {
  InitiatePaymentDto,
  CheckUpiStatusDto,
  PaymentCallbackDto,
  NsePassthroughPipe,
} from '../dto/nmf.dto'

@ApiTags('NSE NMF Payments')
@Controller('api/v1/nmf/payments')
export class NsePaymentsController {
  constructor(private paymentService: NsePaymentService) {}

  // Static routes MUST come before parametric :orderId route

  @Post('upi-status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('advisor', 'admin', 'fa_staff')
  @ApiOperation({ summary: 'Check UPI payment status' })
  async checkUpiStatus(@CurrentUser() user: any, @Body() data: CheckUpiStatusDto) {
    return this.paymentService.checkUpiStatus(user.id, data)
  }

  @Post('callback')
  @Public()
  @UseGuards(CallbackSignatureGuard)
  @CallbackSecret('nmf.callbackSecret')
  @ApiOperation({ summary: 'Payment callback webhook (public)' })
  async callback(@Body(NsePassthroughPipe) data: PaymentCallbackDto) {
    return this.paymentService.handlePaymentCallback(data)
  }

  // Parametric routes AFTER static routes

  @Post(':orderId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('advisor', 'admin', 'fa_staff')
  @ApiOperation({ summary: 'Initiate payment for order' })
  async initiate(
    @Param('orderId') orderId: string,
    @CurrentUser() user: any,
    @Body() data: InitiatePaymentDto,
  ) {
    return this.paymentService.initiatePayment(orderId, user.id, data)
  }

  @Get(':orderId/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('advisor', 'admin', 'fa_staff')
  @ApiOperation({ summary: 'Get payment status' })
  async getStatus(
    @Param('orderId') orderId: string,
    @CurrentUser() user: any,
  ) {
    return this.paymentService.getPaymentStatus(orderId, user.id)
  }
}
