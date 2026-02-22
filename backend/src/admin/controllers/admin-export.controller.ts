import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import type { Response } from 'express'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { AdminExportService } from '../services/admin-export.service'
import { ExportQueryDto } from '../dto/export-query.dto'

@ApiTags('admin-export')
@Controller('api/v1/admin/export')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
export class AdminExportController {
  constructor(private service: AdminExportService) {}

  @Get('users')
  async exportUsers(@Query() query: ExportQueryDto, @Res() res: Response) {
    const csv = await this.service.exportUsers(query)
    this.sendCsv(res, csv, 'users-export.csv')
  }

  @Get('audit-logs')
  async exportAuditLogs(@Query() query: ExportQueryDto, @Res() res: Response) {
    const csv = await this.service.exportAuditLogs(query)
    this.sendCsv(res, csv, 'audit-logs-export.csv')
  }

  @Get('transactions')
  async exportTransactions(@Query() query: ExportQueryDto, @Res() res: Response) {
    const csv = await this.service.exportTransactions(query)
    this.sendCsv(res, csv, 'transactions-export.csv')
  }

  @Get('advisors')
  async exportAdvisors(@Res() res: Response) {
    const csv = await this.service.exportAdvisors()
    this.sendCsv(res, csv, 'advisors-export.csv')
  }

  private sendCsv(res: Response, csv: string, filename: string) {
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(csv)
  }
}
