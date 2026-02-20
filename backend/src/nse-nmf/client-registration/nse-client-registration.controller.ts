import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { NseUccService } from './nse-ucc.service'
import { NseFatcaService } from './nse-fatca.service'
import { NseEkycService } from './nse-ekyc.service'
import {
  RegisterUccDto,
  SubmitFatcaDto,
  InitiateEkycDto,
  NsePassthroughPipe,
} from '../dto/nmf.dto'

@ApiTags('NSE NMF Client Registration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('advisor', 'admin', 'fa_staff')
@Controller('api/v1/nmf/ucc')
export class NseClientRegistrationController {
  constructor(
    private uccService: NseUccService,
    private fatcaService: NseFatcaService,
    private ekycService: NseEkycService,
  ) {}

  @Get(':clientId')
  @ApiOperation({ summary: 'Get NSE UCC registration status' })
  async getStatus(
    @Param('clientId') clientId: string,
    @CurrentUser() user: any,
  ) {
    return this.uccService.getRegistrationStatus(clientId, user.id)
  }

  @Post(':clientId/register')
  @ApiOperation({ summary: 'Submit UCC registration (183 fields)' })
  async register(
    @Param('clientId') clientId: string,
    @CurrentUser() user: any,
    @Body(NsePassthroughPipe) data: RegisterUccDto,
  ) {
    return this.uccService.registerUcc(clientId, user.id, data)
  }

  @Put(':clientId')
  @ApiOperation({ summary: 'Modify existing UCC registration' })
  async modify(
    @Param('clientId') clientId: string,
    @CurrentUser() user: any,
    @Body(NsePassthroughPipe) data: RegisterUccDto,
  ) {
    return this.uccService.modifyUcc(clientId, user.id, data)
  }

  @Post(':clientId/fatca')
  @ApiOperation({ summary: 'Upload FATCA for client' })
  async uploadFatca(
    @Param('clientId') clientId: string,
    @CurrentUser() user: any,
    @Body(NsePassthroughPipe) data: SubmitFatcaDto,
  ) {
    return this.fatcaService.uploadFatca(clientId, user.id, data)
  }

  @Post(':clientId/ekyc')
  @ApiOperation({ summary: 'Initiate eKYC registration' })
  async initiateEkyc(
    @Param('clientId') clientId: string,
    @CurrentUser() user: any,
    @Body(NsePassthroughPipe) data: InitiateEkycDto,
  ) {
    return this.ekycService.initiateEkyc(clientId, user.id, data)
  }
}
