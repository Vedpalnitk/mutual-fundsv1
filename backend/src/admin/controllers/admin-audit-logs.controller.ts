import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { AdminAuditLogsService } from '../services/admin-audit-logs.service'
import { AuditLogQueryDto } from '../dto/audit-log-query.dto'

@ApiTags('admin-audit-logs')
@Controller('api/v1/admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
export class AdminAuditLogsController {
  constructor(private service: AdminAuditLogsService) {}

  @Get()
  findAll(@Query() query: AuditLogQueryDto) {
    return this.service.findAll(query)
  }

  @Get('stats')
  getStats() {
    return this.service.getStats()
  }
}
