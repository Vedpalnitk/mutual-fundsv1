import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { EuinCommissionService } from './euin-commission.service'
import { CreateSplitDto, UpdateSplitDto, ComputePayoutsDto } from './dto'
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface'

@ApiTags('euin-commission')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/euin-commission')
export class EuinCommissionController {
  constructor(private euinCommissionService: EuinCommissionService) {}

  private ensureAdvisor(user: AuthenticatedUser) {
    if (user.role !== 'advisor') {
      throw new ForbiddenException('Only advisors can manage commission splits')
    }
  }

  // ─── Splits ───

  @Get('splits')
  listSplits(@CurrentUser() user: AuthenticatedUser) {
    this.ensureAdvisor(user)
    return this.euinCommissionService.listSplits(user.id)
  }

  @Post('splits')
  createSplit(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSplitDto) {
    this.ensureAdvisor(user)
    return this.euinCommissionService.createSplit(user.id, dto)
  }

  @Put('splits/:id')
  updateSplit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateSplitDto,
  ) {
    this.ensureAdvisor(user)
    return this.euinCommissionService.updateSplit(id, user.id, dto)
  }

  @Delete('splits/:id')
  deleteSplit(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    this.ensureAdvisor(user)
    return this.euinCommissionService.deleteSplit(id, user.id)
  }

  // ─── Compute ───

  @Post('compute')
  computePayouts(@CurrentUser() user: AuthenticatedUser, @Body() dto: ComputePayoutsDto) {
    this.ensureAdvisor(user)
    return this.euinCommissionService.computePayouts(user.id, dto)
  }

  // ─── Payouts ───

  @Get('payouts')
  listPayouts(
    @CurrentUser() user: AuthenticatedUser,
    @Query('period') period?: string,
    @Query('staffMemberId') staffMemberId?: string,
    @Query('status') status?: string,
  ) {
    this.ensureAdvisor(user)
    return this.euinCommissionService.listPayouts(user.id, { period, staffMemberId, status })
  }

  @Post('payouts/:id/approve')
  approvePayout(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    this.ensureAdvisor(user)
    return this.euinCommissionService.approvePayout(id, user.id)
  }

  @Post('payouts/:id/mark-paid')
  markPaid(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    this.ensureAdvisor(user)
    return this.euinCommissionService.markPaid(id, user.id)
  }

  @Post('payouts/:id/dispute')
  disputePayout(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    this.ensureAdvisor(user)
    return this.euinCommissionService.disputePayout(id, user.id)
  }

  // ─── Summary ───

  @Get('summary')
  getSummary(@CurrentUser() user: AuthenticatedUser) {
    this.ensureAdvisor(user)
    return this.euinCommissionService.getSummary(user.id)
  }
}
