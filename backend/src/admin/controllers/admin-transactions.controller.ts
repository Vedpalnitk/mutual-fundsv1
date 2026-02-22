import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { AdminTransactionsService } from '../services/admin-transactions.service'
import { AdminTransactionQueryDto } from '../dto/admin-transaction-query.dto'

@ApiTags('admin-transactions')
@Controller('api/v1/admin/transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
export class AdminTransactionsController {
  constructor(private service: AdminTransactionsService) {}

  @Get('overview')
  getOverview() {
    return this.service.getOverview()
  }

  @Get()
  findAll(@Query() query: AdminTransactionQueryDto) {
    return this.service.findAll(query)
  }

  @Get('failed')
  getFailed() {
    return this.service.getFailed()
  }
}
