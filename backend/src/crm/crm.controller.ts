import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { StaffPageGuard, RequiredPage } from '../common/guards/staff-page.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { getEffectiveAdvisorId } from '../common/utils/effective-advisor'
import { CRMService } from './crm.service'
import {
  CreateTaskDto, UpdateTaskDto, TaskFilterDto,
  CreateActivityDto, ActivityFilterDto,
} from './dto'
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface'

@ApiTags('crm')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StaffPageGuard)
@RequiredPage('/advisor/command-center')
@Controller('api/v1/crm')
export class CRMController {
  constructor(private crmService: CRMService) {}

  // ============= TASKS =============

  @Get('tasks')
  @ApiOperation({ summary: 'List CRM tasks' })
  listTasks(@CurrentUser() user: AuthenticatedUser, @Query() filters: TaskFilterDto) {
    return this.crmService.listTasks(getEffectiveAdvisorId(user), filters)
  }

  @Post('tasks')
  @ApiOperation({ summary: 'Create a CRM task' })
  createTask(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTaskDto) {
    return this.crmService.createTask(getEffectiveAdvisorId(user), user.id, dto)
  }

  @Put('tasks/:id')
  @ApiOperation({ summary: 'Update a CRM task' })
  updateTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.crmService.updateTask(id, getEffectiveAdvisorId(user), user.id, dto)
  }

  @Put('tasks/:id/complete')
  @ApiOperation({ summary: 'Mark task as completed' })
  completeTask(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.crmService.completeTask(id, getEffectiveAdvisorId(user), user.id)
  }

  @Get('tasks/overdue')
  @ApiOperation({ summary: 'Get overdue tasks' })
  getOverdueTasks(@CurrentUser() user: AuthenticatedUser) {
    return this.crmService.getOverdueTasks(getEffectiveAdvisorId(user))
  }

  @Get('tasks/summary')
  @ApiOperation({ summary: 'Get task summary stats' })
  getTaskSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.crmService.getTaskSummary(getEffectiveAdvisorId(user))
  }

  // ============= ACTIVITIES =============

  @Get('activities')
  @ApiOperation({ summary: 'List activity log' })
  listActivities(@CurrentUser() user: AuthenticatedUser, @Query() filters: ActivityFilterDto) {
    return this.crmService.listActivities(getEffectiveAdvisorId(user), filters)
  }

  @Post('activities')
  @ApiOperation({ summary: 'Log an activity' })
  createActivity(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateActivityDto) {
    const staffId = user.role === 'fa_staff' ? user.staffProfileId : undefined
    return this.crmService.createActivity(getEffectiveAdvisorId(user), user.id, dto, staffId)
  }
}
