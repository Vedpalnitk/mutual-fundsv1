import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { BseMandateService } from './bse-mandate.service'
import { RegisterMandateDto, ShiftMandateDto } from './dto/register-mandate.dto'

@ApiTags('BSE Mandates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('advisor', 'admin', 'fa_staff')
@Controller('api/v1/bse/mandates')
export class BseMandatesController {
  constructor(private mandateService: BseMandateService) {}

  @Get()
  @ApiOperation({ summary: 'List mandates for the logged-in advisor' })
  @ApiQuery({ name: 'clientId', required: false, description: 'Filter by client ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by mandate status' })
  async listMandates(
    @CurrentUser() user: any,
    @Query('clientId') clientId?: string,
    @Query('status') status?: string,
  ) {
    return this.mandateService.listMandates(user.id, { clientId, status })
  }

  @Post()
  @ApiOperation({ summary: 'Register a new mandate with BSE' })
  async registerMandate(
    @CurrentUser() user: any,
    @Body() dto: RegisterMandateDto,
  ) {
    return this.mandateService.register(user.id, dto)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get mandate detail and BSE status' })
  async getMandateDetail(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.mandateService.getStatus(id, user.id)
  }

  @Get(':id/auth-url')
  @ApiOperation({ summary: 'Get e-NACH authentication URL for mandate' })
  async getAuthUrl(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.mandateService.getAuthUrl(id, user.id)
  }

  @Post(':id/refresh-status')
  @ApiOperation({ summary: 'Poll BSE for latest mandate status and update DB' })
  async refreshStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.mandateService.refreshStatus(id, user.id)
  }

  @Post(':id/shift')
  @ApiOperation({ summary: 'Shift SIPs from one mandate to another' })
  async shiftMandate(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: ShiftMandateDto,
  ) {
    return this.mandateService.shiftMandate(user.id, dto)
  }
}
