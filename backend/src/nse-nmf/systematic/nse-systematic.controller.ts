import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { NseSipService } from './nse-sip.service'
import { NseXsipService } from './nse-xsip.service'
import { NseStpService } from './nse-stp.service'
import { NseSwpService } from './nse-swp.service'
import { NsePauseService } from './nse-pause.service'
import { NseCancellationService } from '../cancellation/nse-cancellation.service'
import {
  RegisterSipDto,
  RegisterSipTopupDto,
  RegisterXsipDto,
  RegisterStpDto,
  RegisterSwpDto,
} from '../dto/nmf.dto'
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface'

@ApiTags('NSE NMF Systematic Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('advisor', 'admin', 'fa_staff')
@Controller('api/v1/nmf/systematic')
export class NseSystematicController {
  constructor(
    private sipService: NseSipService,
    private xsipService: NseXsipService,
    private stpService: NseStpService,
    private swpService: NseSwpService,
    private pauseService: NsePauseService,
    private cancellationService: NseCancellationService,
  ) {}

  @Post('sip')
  @ApiOperation({ summary: 'Register SIP' })
  async registerSip(@CurrentUser() user: AuthenticatedUser, @Body() data: RegisterSipDto) {
    return this.sipService.registerSip(user.id, data)
  }

  @Post('xsip')
  @ApiOperation({ summary: 'Register XSIP (mandate-based)' })
  async registerXsip(@CurrentUser() user: AuthenticatedUser, @Body() data: RegisterXsipDto) {
    return this.xsipService.registerXsip(user.id, data)
  }

  @Post('sip-topup')
  @ApiOperation({ summary: 'Register SIP Topup (add-on to existing SIP)' })
  async registerSipTopup(@CurrentUser() user: AuthenticatedUser, @Body() data: RegisterSipTopupDto) {
    return this.sipService.registerSipTopup(user.id, data)
  }

  @Post('stp')
  @ApiOperation({ summary: 'Register STP' })
  async registerStp(@CurrentUser() user: AuthenticatedUser, @Body() data: RegisterStpDto) {
    return this.stpService.registerStp(user.id, data)
  }

  @Post('swp')
  @ApiOperation({ summary: 'Register SWP' })
  async registerSwp(@CurrentUser() user: AuthenticatedUser, @Body() data: RegisterSwpDto) {
    return this.swpService.registerSwp(user.id, data)
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel systematic registration' })
  async cancel(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.cancellationService.cancelSystematic(id, user.id)
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause SIP/XSIP (NSE-specific)' })
  async pause(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.pauseService.pauseResume(id, user.id, 'PAUSE')
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Resume paused SIP/XSIP' })
  async resume(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.pauseService.pauseResume(id, user.id, 'RESUME')
  }
}
