import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ActionsService } from './actions.service';
import { CreateActionDto, UpdateActionDto } from './dto/action.dto';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface'

@ApiTags('actions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/me/actions')
export class ActionsController {
  constructor(private actionsService: ActionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user actions/reminders' })
  @ApiResponse({ status: 200, description: 'List of user actions' })
  @ApiQuery({ name: 'includeCompleted', required: false, type: Boolean })
  @ApiQuery({ name: 'includeDismissed', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getActions(
    @CurrentUser() user: AuthenticatedUser,
    @Query('includeCompleted') includeCompleted?: string,
    @Query('includeDismissed') includeDismissed?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.actionsService.getUserActions(
      user.id,
      includeCompleted === 'true',
      includeDismissed === 'true',
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get action by ID' })
  @ApiResponse({ status: 200, description: 'Action details' })
  async getAction(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.actionsService.getActionById(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new action/reminder' })
  @ApiResponse({ status: 201, description: 'Action created' })
  async createAction(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateActionDto) {
    return this.actionsService.createAction(user.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update action status' })
  @ApiResponse({ status: 200, description: 'Action updated' })
  async updateAction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateActionDto,
  ) {
    return this.actionsService.updateAction(user.id, id, dto);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark action as read' })
  @ApiResponse({ status: 200, description: 'Action marked as read' })
  async markAsRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.actionsService.markAsRead(user.id, id);
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Mark all actions as read' })
  @ApiResponse({ status: 200, description: 'All actions marked as read' })
  async markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    return this.actionsService.markAllAsRead(user.id);
  }

  @Put(':id/dismiss')
  @ApiOperation({ summary: 'Dismiss an action' })
  @ApiResponse({ status: 200, description: 'Action dismissed' })
  async dismissAction(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.actionsService.dismissAction(user.id, id);
  }

  @Put(':id/complete')
  @ApiOperation({ summary: 'Mark action as completed' })
  @ApiResponse({ status: 200, description: 'Action completed' })
  async completeAction(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.actionsService.completeAction(user.id, id);
  }
}
