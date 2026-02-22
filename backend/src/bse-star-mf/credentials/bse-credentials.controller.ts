import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { BseCredentialsService, SetCredentialsDto } from './bse-credentials.service'
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface'

@ApiTags('BSE Credentials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('advisor', 'admin', 'fa_staff')
@Controller('api/v1/bse/credentials')
export class BseCredentialsController {
  constructor(private credentialsService: BseCredentialsService) {}

  @Get()
  @ApiOperation({ summary: 'Get BSE credential configuration status' })
  async getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.credentialsService.getStatus(user.id)
  }

  @Post()
  @ApiOperation({ summary: 'Set or update BSE partner credentials' })
  async setCredentials(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SetCredentialsDto,
  ) {
    return this.credentialsService.setCredentials(user.id, dto)
  }

  @Post('test')
  @ApiOperation({ summary: 'Test BSE connection with stored credentials' })
  async testConnection(@CurrentUser() user: AuthenticatedUser) {
    return this.credentialsService.testConnection(user.id)
  }
}
