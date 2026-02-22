import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { AdminExchangeHealthService } from '../services/admin-exchange-health.service'

@ApiTags('admin-exchange-health')
@Controller('api/v1/admin/exchange-health')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
export class AdminExchangeHealthController {
  constructor(private service: AdminExchangeHealthService) {}

  @Get()
  getCombinedHealth() {
    return this.service.getCombinedHealth()
  }

  @Get('bse')
  getBseHealth() {
    return this.service.getBseHealth()
  }

  @Get('nse')
  getNseHealth() {
    return this.service.getNseHealth()
  }
}
