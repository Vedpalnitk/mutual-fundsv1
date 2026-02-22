import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StaffPageGuard, RequiredPage } from '../common/guards/staff-page.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { getEffectiveAdvisorId } from '../common/utils/effective-advisor';
import { CommunicationsService } from './communications.service';
import { PreviewCommunicationDto, SendCommunicationDto, BulkSendCommunicationDto, CommunicationHistoryFilterDto } from './dto';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface'

@ApiTags('communications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StaffPageGuard)
@RequiredPage('/advisor/command-center')
@Controller('api/v1/communications')
export class CommunicationsController {
  constructor(private communicationsService: CommunicationsService) {}

  @Get('templates')
  getTemplates() {
    return this.communicationsService.getTemplates();
  }

  @Post('preview')
  preview(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PreviewCommunicationDto,
  ) {
    return this.communicationsService.preview(getEffectiveAdvisorId(user), dto);
  }

  @Post('send')
  send(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendCommunicationDto,
  ) {
    return this.communicationsService.send(getEffectiveAdvisorId(user), dto);
  }

  @Post('send-bulk')
  sendBulk(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BulkSendCommunicationDto,
  ) {
    return this.communicationsService.sendBulk(getEffectiveAdvisorId(user), dto);
  }

  @Get('history')
  getHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filters: CommunicationHistoryFilterDto,
  ) {
    return this.communicationsService.getHistory(getEffectiveAdvisorId(user), filters);
  }

  @Get('history/stats')
  getStats(@CurrentUser() user: AuthenticatedUser) {
    return this.communicationsService.getStats(getEffectiveAdvisorId(user));
  }
}
