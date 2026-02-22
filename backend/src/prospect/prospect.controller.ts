import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { StaffPageGuard, RequiredPage } from '../common/guards/staff-page.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { getEffectiveAdvisorId } from '../common/utils/effective-advisor'
import { ProspectService } from './prospect.service'
import {
  CreateProspectDto, UpdateProspectDto, ProspectFilterDto,
  ConvertProspectDto, CreateMeetingNoteDto,
} from './dto'
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface'

@ApiTags('prospects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StaffPageGuard)
@RequiredPage('/advisor/pipeline')
@Controller('api/v1/prospects')
export class ProspectController {
  constructor(private prospectService: ProspectService) {}

  @Get()
  @ApiOperation({ summary: 'List prospects' })
  list(@CurrentUser() user: AuthenticatedUser, @Query() filters: ProspectFilterDto) {
    return this.prospectService.list(getEffectiveAdvisorId(user), filters)
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get pipeline stats' })
  getStats(@CurrentUser() user: AuthenticatedUser) {
    return this.prospectService.getStats(getEffectiveAdvisorId(user))
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single prospect' })
  getById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.prospectService.getById(id, getEffectiveAdvisorId(user))
  }

  @Post()
  @ApiOperation({ summary: 'Create prospect' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProspectDto) {
    return this.prospectService.create(getEffectiveAdvisorId(user), user.id, dto)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update prospect' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateProspectDto,
  ) {
    return this.prospectService.update(id, getEffectiveAdvisorId(user), user.id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete prospect' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.prospectService.remove(id, getEffectiveAdvisorId(user), user.id)
  }

  @Post(':id/convert')
  @ApiOperation({ summary: 'Convert prospect to client' })
  convert(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ConvertProspectDto,
  ) {
    return this.prospectService.convert(id, getEffectiveAdvisorId(user), user.id, dto)
  }

  @Post(':id/meeting-notes')
  @ApiOperation({ summary: 'Add meeting note' })
  addMeetingNote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateMeetingNoteDto,
  ) {
    return this.prospectService.addMeetingNote(id, getEffectiveAdvisorId(user), dto)
  }
}
