import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

const SKIPPABLE_STEPS = [4, 5, 6]

const STEP_FIELD_MAP: Record<number, string> = {
  1: 'profileCompleted',
  2: 'arnCompleted',
  3: 'exchangeCompleted',
  4: 'teamCompleted',
  5: 'importCompleted',
  6: 'commissionCompleted',
  7: 'wizardCompleted',
}

const SKIP_FIELD_MAP: Record<number, string> = {
  4: 'teamSkipped',
  5: 'importSkipped',
  6: 'commissionSkipped',
}

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

  async getOrCreate(advisorId: string) {
    const existing = await this.prisma.advisorOnboarding.findUnique({
      where: { advisorId },
    })
    if (existing) return existing

    return this.prisma.advisorOnboarding.create({
      data: { advisorId },
    })
  }

  async getStatus(advisorId: string) {
    const onboarding = await this.getOrCreate(advisorId)
    return this.formatResponse(onboarding)
  }

  async completeStep(advisorId: string, step: number, _data?: any) {
    const onboarding = await this.getOrCreate(advisorId)

    const completionField = STEP_FIELD_MAP[step]
    if (!completionField) {
      throw new BadRequestException(`Invalid step: ${step}`)
    }

    // Don't allow completing steps out of order (except going back)
    if (step > onboarding.currentStep + 1) {
      throw new BadRequestException('Cannot skip required steps')
    }

    const updateData: any = {
      [completionField]: true,
    }

    // Advance currentStep if this step is at or ahead of current
    if (step >= onboarding.currentStep) {
      updateData.currentStep = Math.min(step + 1, 7)
    }

    const updated = await this.prisma.advisorOnboarding.update({
      where: { advisorId },
      data: updateData,
    })

    return this.formatResponse(updated)
  }

  async skipStep(advisorId: string, step: number) {
    if (!SKIPPABLE_STEPS.includes(step)) {
      throw new BadRequestException(`Step ${step} cannot be skipped`)
    }

    const onboarding = await this.getOrCreate(advisorId)

    const completionField = STEP_FIELD_MAP[step]
    const skipField = SKIP_FIELD_MAP[step]

    const updateData: any = {
      [completionField]: true,
      [skipField]: true,
    }

    if (step >= onboarding.currentStep) {
      updateData.currentStep = Math.min(step + 1, 7)
    }

    const updated = await this.prisma.advisorOnboarding.update({
      where: { advisorId },
      data: updateData,
    })

    return this.formatResponse(updated)
  }

  async completeWizard(advisorId: string) {
    const onboarding = await this.getOrCreate(advisorId)

    // Validate required steps are done
    if (!onboarding.profileCompleted) {
      throw new BadRequestException('Profile step must be completed')
    }
    if (!onboarding.arnCompleted) {
      throw new BadRequestException('ARN step must be completed')
    }
    if (!onboarding.exchangeCompleted) {
      throw new BadRequestException('Exchange setup step must be completed')
    }

    const updated = await this.prisma.advisorOnboarding.update({
      where: { advisorId },
      data: {
        wizardCompleted: true,
        currentStep: 7,
        completedAt: new Date(),
      },
    })

    return this.formatResponse(updated)
  }

  async isComplete(advisorId: string): Promise<boolean> {
    const onboarding = await this.prisma.advisorOnboarding.findUnique({
      where: { advisorId },
    })
    return onboarding?.wizardCompleted ?? false
  }

  private formatResponse(onboarding: any) {
    return {
      id: onboarding.id,
      currentStep: onboarding.currentStep,
      isComplete: onboarding.wizardCompleted,
      steps: {
        profile: { completed: onboarding.profileCompleted, skipped: false },
        arn: { completed: onboarding.arnCompleted, skipped: false },
        exchange: { completed: onboarding.exchangeCompleted, skipped: false },
        team: { completed: onboarding.teamCompleted, skipped: onboarding.teamSkipped },
        import: { completed: onboarding.importCompleted, skipped: onboarding.importSkipped },
        commission: { completed: onboarding.commissionCompleted, skipped: onboarding.commissionSkipped },
      },
      importStatus: {
        camsWbrUploaded: onboarding.camsWbrUploaded,
        kfintechMisUploaded: onboarding.kfintechMisUploaded,
        camsWbrImportId: onboarding.camsWbrImportId,
        kfintechMisImportId: onboarding.kfintechMisImportId,
      },
      completedAt: onboarding.completedAt,
    }
  }
}
