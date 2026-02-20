import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { CallbackSignatureGuard, CallbackSecret } from '../../common/guards/callback-signature.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Public } from '../../common/decorators/public.decorator'
import { BsePaymentService } from './bse-payment.service'
import { InitiatePaymentDto } from './dto/initiate-payment.dto'

@ApiTags('BSE Payments')
@Controller('api/v1/bse/payments')
export class BsePaymentsController {
  constructor(private paymentService: BsePaymentService) {}

  @Post(':orderId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('advisor', 'admin', 'fa_staff')
  @ApiOperation({ summary: 'Initiate payment for an order' })
  async initiatePayment(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Body() dto: InitiatePaymentDto,
  ) {
    return this.paymentService.initiatePayment(orderId, user.id, dto)
  }

  @Get(':orderId/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('advisor', 'admin', 'fa_staff')
  @ApiOperation({ summary: 'Check payment status for an order' })
  async getPaymentStatus(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
  ) {
    return this.paymentService.getPaymentStatus(orderId, user.id)
  }

  @Post('callback')
  @Public()
  @UseGuards(CallbackSignatureGuard)
  @CallbackSecret('bse.callbackSecret')
  @ApiOperation({ summary: 'Payment callback from BSE (public endpoint)' })
  async handleCallback(@Body() callbackData: any) {
    return this.paymentService.handleCallback(callbackData)
  }
}
