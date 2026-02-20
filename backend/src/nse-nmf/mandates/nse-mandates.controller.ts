import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { NseMandateService } from './nse-mandate.service'
import { RegisterMandateDto } from '../dto/nmf.dto'

@ApiTags('NSE NMF Mandates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('advisor', 'admin', 'fa_staff')
@Controller('api/v1/nmf/mandates')
export class NseMandatesController {
  constructor(private mandateService: NseMandateService) {}

  @Get()
  @ApiOperation({ summary: 'List NSE mandates' })
  async list(
    @CurrentUser() user: any,
    @Query('clientId') clientId?: string,
    @Query('status') status?: string,
  ) {
    return this.mandateService.listMandates(user.id, { clientId, status })
  }

  @Post()
  @ApiOperation({ summary: 'Register mandate (supports batch up to 50)' })
  async register(
    @CurrentUser() user: any,
    @Body() data: RegisterMandateDto,
  ) {
    return this.mandateService.registerMandate(user.id, data)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get mandate detail' })
  async getOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.mandateService.getMandate(id, user.id)
  }

  @Post(':id/refresh-status')
  @ApiOperation({ summary: 'Poll NSE for mandate status' })
  async refreshStatus(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.mandateService.refreshMandateStatus(id, user.id)
  }
}
