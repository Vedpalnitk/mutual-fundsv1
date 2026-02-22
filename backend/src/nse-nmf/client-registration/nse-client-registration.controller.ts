import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common'
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
  SubmitFatcaCorporateDto,
  AddBankDetailDto,
  DeleteBankDetailDto,
  InitiateEkycDto,
  NsePassthroughPipe,
} from '../dto/nmf.dto'
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface'
import { getEffectiveAdvisorId } from '../../common/utils/effective-advisor'

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

  @Post('batch-status')
  @ApiOperation({ summary: 'Get NSE UCC registration status for multiple clients' })
  async batchRegistrationStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { clientIds: string[] },
  ) {
    const advisorId = getEffectiveAdvisorId(user)
    return this.uccService.batchRegistrationStatus(body.clientIds, advisorId)
  }

  @Get(':clientId')
  @ApiOperation({ summary: 'Get NSE UCC registration status' })
  async getStatus(
    @Param('clientId') clientId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.uccService.getRegistrationStatus(clientId, user.id)
  }

  @Post(':clientId/register')
  @ApiOperation({ summary: 'Submit UCC registration (183 fields)' })
  async register(
    @Param('clientId') clientId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(NsePassthroughPipe) data: RegisterUccDto,
  ) {
    return this.uccService.registerUcc(clientId, user.id, data)
  }

  @Put(':clientId')
  @ApiOperation({ summary: 'Modify existing UCC registration' })
  async modify(
    @Param('clientId') clientId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(NsePassthroughPipe) data: RegisterUccDto,
  ) {
    return this.uccService.modifyUcc(clientId, user.id, data)
  }

  @Post(':clientId/fatca')
  @ApiOperation({ summary: 'Upload FATCA for client' })
  async uploadFatca(
    @Param('clientId') clientId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(NsePassthroughPipe) data: SubmitFatcaDto,
  ) {
    return this.fatcaService.uploadFatca(clientId, user.id, data)
  }

  @Post(':clientId/fatca-corporate')
  @ApiOperation({ summary: 'Upload FATCA for corporate/non-individual client' })
  async uploadFatcaCorporate(
    @Param('clientId') clientId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(NsePassthroughPipe) data: SubmitFatcaCorporateDto,
  ) {
    return this.fatcaService.uploadFatcaCorporate(clientId, user.id, data)
  }

  @Post(':clientId/bank-detail')
  @ApiOperation({ summary: 'Add bank detail to client UCC' })
  async addBankDetail(
    @Param('clientId') clientId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(NsePassthroughPipe) data: AddBankDetailDto,
  ) {
    return this.uccService.addBankDetail(clientId, user.id, data)
  }

  @Delete(':clientId/bank-detail')
  @ApiOperation({ summary: 'Delete bank detail from client UCC' })
  async deleteBankDetail(
    @Param('clientId') clientId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: DeleteBankDetailDto,
  ) {
    return this.uccService.deleteBankDetail(clientId, user.id, data)
  }

  @Post(':clientId/ekyc')
  @ApiOperation({ summary: 'Initiate eKYC registration' })
  async initiateEkyc(
    @Param('clientId') clientId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(NsePassthroughPipe) data: InitiateEkycDto,
  ) {
    return this.ekycService.initiateEkyc(clientId, user.id, data)
  }
}
