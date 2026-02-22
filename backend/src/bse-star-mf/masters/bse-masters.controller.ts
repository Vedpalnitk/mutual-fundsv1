import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { BseMastersService } from './bse-masters.service'
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface'

@ApiTags('BSE Masters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('advisor', 'admin', 'fa_staff')
@Controller('api/v1/bse')
export class BseMastersController {
  constructor(private mastersService: BseMastersService) {}

  @Get('scheme-master')
  @ApiOperation({ summary: 'Search BSE schemes' })
  async searchSchemes(
    @Query('q') query?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.mastersService.searchSchemes(
      query || '',
      parseInt(page || '1'),
      parseInt(limit || '20'),
    )
  }

  @Post('scheme-master/sync')
  @ApiOperation({ summary: 'Trigger scheme master sync' })
  async syncSchemeMaster(@CurrentUser() user: AuthenticatedUser) {
    return this.mastersService.syncSchemeMaster(user.id)
  }

  @Get('banks')
  @ApiOperation({ summary: 'List supported banks by payment mode' })
  async listBanks(@Query('mode') paymentMode?: string) {
    return this.mastersService.listBanks(paymentMode)
  }

  @Get('masters/tax-status')
  @ApiOperation({ summary: 'Tax status code reference' })
  async getTaxStatusCodes() {
    return this.mastersService.getTaxStatusCodes()
  }
}
