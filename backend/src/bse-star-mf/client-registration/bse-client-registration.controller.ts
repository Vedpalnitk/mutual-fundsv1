import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { BseUccService } from './bse-ucc.service'
import { BseFatcaService } from './bse-fatca.service'
import { BseCkycService } from './bse-ckyc.service'
import { RegisterUccDto, UploadFatcaDto, UploadCkycDto } from './dto/register-ucc.dto'
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface'
import { getEffectiveAdvisorId } from '../../common/utils/effective-advisor'

@ApiTags('BSE Client Registration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('advisor', 'admin', 'fa_staff')
@Controller('api/v1/bse/ucc')
export class BseClientRegistrationController {
  constructor(
    private uccService: BseUccService,
    private fatcaService: BseFatcaService,
    private ckycService: BseCkycService,
  ) {}

  @Post('batch-status')
  @ApiOperation({ summary: 'Get BSE registration status for multiple clients' })
  async batchRegistrationStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { clientIds: string[] },
  ) {
    const advisorId = getEffectiveAdvisorId(user)
    return this.uccService.batchRegistrationStatus(body.clientIds, advisorId)
  }

  @Get(':clientId')
  @ApiOperation({ summary: 'Get BSE registration status for a client' })
  async getRegistrationStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId') clientId: string,
  ) {
    return this.uccService.getRegistrationStatus(clientId, user.id)
  }

  @Post(':clientId/register')
  @ApiOperation({ summary: 'Submit UCC registration to BSE' })
  async registerClient(
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId') clientId: string,
    @Body() dto: RegisterUccDto,
  ) {
    return this.uccService.registerClient(clientId, user.id, dto)
  }

  @Put(':clientId')
  @ApiOperation({ summary: 'Modify existing UCC registration' })
  async modifyRegistration(
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId') clientId: string,
    @Body() dto: RegisterUccDto,
  ) {
    dto.transType = 'MOD' as any
    return this.uccService.registerClient(clientId, user.id, dto)
  }

  @Post(':clientId/fatca')
  @ApiOperation({ summary: 'Upload FATCA declaration for client' })
  async uploadFatca(
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId') clientId: string,
    @Body() dto: UploadFatcaDto,
  ) {
    return this.fatcaService.uploadFatca(clientId, user.id, dto)
  }

  @Post(':clientId/ckyc')
  @ApiOperation({ summary: 'Upload CKYC for client' })
  async uploadCkyc(
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId') clientId: string,
    @Body() dto: UploadCkycDto,
  ) {
    return this.ckycService.uploadCkyc(clientId, user.id, dto)
  }
}
