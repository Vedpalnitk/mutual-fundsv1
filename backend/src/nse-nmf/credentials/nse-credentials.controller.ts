import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { NseCredentialsService } from './nse-credentials.service'
import { SetCredentialsDto } from '../dto/nmf.dto'

@ApiTags('NSE NMF Credentials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('advisor', 'admin', 'fa_staff')
@Controller('api/v1/nmf/credentials')
export class NseCredentialsController {
  constructor(private credentialsService: NseCredentialsService) {}

  @Get()
  @ApiOperation({ summary: 'Get NSE credential configuration status' })
  async getStatus(@CurrentUser() user: any) {
    return this.credentialsService.getStatus(user.id)
  }

  @Post()
  @ApiOperation({ summary: 'Set or update NSE partner credentials' })
  async setCredentials(
    @CurrentUser() user: any,
    @Body() dto: SetCredentialsDto,
  ) {
    return this.credentialsService.setCredentials(user.id, dto)
  }

  @Post('test')
  @ApiOperation({ summary: 'Test NSE connection with stored credentials' })
  async testConnection(@CurrentUser() user: any) {
    return this.credentialsService.testConnection(user.id)
  }
}
