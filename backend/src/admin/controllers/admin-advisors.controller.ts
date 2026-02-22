import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { AdminAdvisorsService } from '../services/admin-advisors.service'
import { AdvisorQueryDto } from '../dto/advisor-query.dto'

@ApiTags('admin-advisors')
@Controller('api/v1/admin/advisors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
export class AdminAdvisorsController {
  constructor(private service: AdminAdvisorsService) {}

  @Get('overview')
  getOverview() {
    return this.service.getOverview()
  }

  @Get()
  findAll(@Query() query: AdvisorQueryDto) {
    return this.service.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }
}
