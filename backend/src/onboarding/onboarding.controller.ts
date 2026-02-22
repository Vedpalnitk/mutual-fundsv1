import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { getEffectiveAdvisorId } from '../common/utils/effective-advisor'
import { OnboardingService } from './onboarding.service'
import { CompleteStepDto, SkipStepDto } from './dto'
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface'

@ApiTags('onboarding')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/advisor/onboarding')
export class OnboardingController {
  constructor(private onboardingService: OnboardingService) {}

  @Get()
  @ApiOperation({ summary: 'Get current onboarding state' })
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.onboardingService.getStatus(getEffectiveAdvisorId(user))
  }

  @Post('step')
  @ApiOperation({ summary: 'Complete an onboarding step' })
  completeStep(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CompleteStepDto,
  ) {
    return this.onboardingService.completeStep(
      getEffectiveAdvisorId(user),
      dto.step,
      dto.data,
    )
  }

  @Post('skip')
  @ApiOperation({ summary: 'Skip an optional onboarding step' })
  skipStep(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SkipStepDto,
  ) {
    return this.onboardingService.skipStep(
      getEffectiveAdvisorId(user),
      dto.step,
    )
  }

  @Post('complete')
  @ApiOperation({ summary: 'Mark onboarding wizard as completed' })
  completeWizard(@CurrentUser() user: AuthenticatedUser) {
    return this.onboardingService.completeWizard(getEffectiveAdvisorId(user))
  }
}
