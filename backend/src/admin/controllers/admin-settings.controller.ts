import { Controller, Get, Put, Param, Body, UseGuards, Req } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { AdminSettingsService } from '../services/admin-settings.service'
import { UpdateSettingDto } from '../dto/system-settings.dto'

@ApiTags('admin-settings')
@Controller('api/v1/admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
export class AdminSettingsController {
  constructor(private service: AdminSettingsService) {}

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Get(':key')
  findOne(@Param('key') key: string) {
    return this.service.findOne(key)
  }

  @Put(':key')
  update(@Param('key') key: string, @Body() dto: UpdateSettingDto, @Req() req: any) {
    return this.service.upsert(key, dto.value, req.user.id)
  }
}
