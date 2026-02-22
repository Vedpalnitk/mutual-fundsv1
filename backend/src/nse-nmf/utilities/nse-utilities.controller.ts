import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { NseUtilitiesService } from './nse-utilities.service'
import {
  UtrUpdateDto,
  SipUmrnDto,
  ShortUrlDto,
  KycCheckDto,
  ResendCommDto,
} from '../dto/nmf.dto'
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface'

@ApiTags('NSE NMF Utilities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('advisor', 'admin', 'fa_staff')
@Controller('api/v1/nmf/utilities')
export class NseUtilitiesController {
  constructor(private utilitiesService: NseUtilitiesService) {}

  @Post('utr-update')
  @ApiOperation({ summary: 'Link UTR to order' })
  async utrUpdate(@CurrentUser() user: AuthenticatedUser, @Body() data: UtrUpdateDto) {
    return this.utilitiesService.updateUtr(user.id, data)
  }

  @Post('sip-umrn')
  @ApiOperation({ summary: 'Map SIP to XSIP mandate (UMRN)' })
  async sipUmrn(@CurrentUser() user: AuthenticatedUser, @Body() data: SipUmrnDto) {
    return this.utilitiesService.mapSipUmrn(user.id, data)
  }

  @Post('short-url')
  @ApiOperation({ summary: 'Get auth/payment short URL' })
  async shortUrl(@CurrentUser() user: AuthenticatedUser, @Body() data: ShortUrlDto) {
    return this.utilitiesService.getShortUrl(user.id, data)
  }

  @Post('kyc-check')
  @ApiOperation({ summary: 'Check KYC by PAN' })
  async kycCheck(@CurrentUser() user: AuthenticatedUser, @Body() data: KycCheckDto) {
    return this.utilitiesService.checkKyc(user.id, data)
  }

  @Post('resend-comm')
  @ApiOperation({ summary: 'Resend auth email' })
  async resendComm(@CurrentUser() user: AuthenticatedUser, @Body() data: ResendCommDto) {
    return this.utilitiesService.resendCommunication(user.id, data)
  }
}
