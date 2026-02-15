import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { InsurancePolicyType } from '@prisma/client';

const HEALTH_TYPES: InsurancePolicyType[] = ['HEALTH', 'CRITICAL_ILLNESS'];

@Injectable()
export class InsuranceReminderService {
  private readonly logger = new Logger(InsuranceReminderService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Cron('0 0 9 * * *', { timeZone: 'Asia/Kolkata' })
  async checkPremiumReminders() {
    this.logger.log('Insurance reminder cron triggered');

    try {
      await Promise.allSettled([
        this.checkUpcomingPremiums(),
        this.checkOverduePolicies(),
        this.checkRenewalsAndMaturities(),
      ]);
    } catch (error) {
      this.logger.error(`Insurance reminder cron failed: ${error.message}`);
    }
  }

  private async checkUpcomingPremiums() {
    const now = new Date();
    const reminderDays = [7, 3, 1];

    for (const days of reminderDays) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + days);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const policies = await this.prisma.insurancePolicy.findMany({
        where: {
          status: 'ACTIVE',
          nextPremiumDate: { gte: startOfDay, lte: endOfDay },
        },
        include: {
          client: {
            select: { advisorId: true, name: true },
          },
        },
      });

      const priority = days === 1 ? 'URGENT' : days === 3 ? 'HIGH' : 'MEDIUM';

      for (const policy of policies) {
        // advisorId on FAClient IS the User.id of the advisor
        const advisorUserId = policy.client.advisorId;

        const title = `Premium due in ${days} day${days > 1 ? 's' : ''}: ${policy.provider}`;
        const description = `${policy.client.name}'s ${policy.provider} policy (${policy.policyNumber}) premium of ₹${Number(policy.premiumAmount).toLocaleString('en-IN')} is due on ${policy.nextPremiumDate?.toLocaleDateString('en-IN')}.`;

        await this.createActionAndNotify(
          advisorUserId,
          'PREMIUM_DUE',
          priority,
          title,
          description,
          policy.id,
          policy.nextPremiumDate,
        );
      }

      if (policies.length > 0) {
        this.logger.log(`Found ${policies.length} policies with premium due in ${days} days`);
      }
    }
  }

  private async checkOverduePolicies() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const overduePolicies = await this.prisma.insurancePolicy.findMany({
      where: {
        status: 'ACTIVE',
        nextPremiumDate: { lt: thirtyDaysAgo },
      },
      include: {
        client: {
          select: { advisorId: true, name: true },
        },
      },
    });

    for (const policy of overduePolicies) {
      await this.prisma.insurancePolicy.update({
        where: { id: policy.id },
        data: { status: 'LAPSED' },
      });

      const advisorUserId = policy.client.advisorId;
      const title = `Policy lapsed: ${policy.provider}`;
      const description = `${policy.client.name}'s ${policy.provider} policy (${policy.policyNumber}) has been marked as lapsed due to non-payment for over 30 days.`;

      await this.createActionAndNotify(
        advisorUserId,
        'PREMIUM_OVERDUE',
        'URGENT',
        title,
        description,
        policy.id,
      );
    }

    if (overduePolicies.length > 0) {
      this.logger.log(`Marked ${overduePolicies.length} policies as lapsed`);
    }
  }

  private async checkRenewalsAndMaturities() {
    const now = new Date();

    // Health policies: renewal within 30 days
    const healthRenewalDate = new Date(now);
    healthRenewalDate.setDate(healthRenewalDate.getDate() + 30);

    const healthRenewals = await this.prisma.insurancePolicy.findMany({
      where: {
        status: 'ACTIVE',
        type: { in: HEALTH_TYPES },
        maturityDate: { gte: now, lte: healthRenewalDate },
      },
      include: {
        client: { select: { advisorId: true, name: true } },
      },
    });

    for (const policy of healthRenewals) {
      const advisorUserId = policy.client.advisorId;
      const daysLeft = Math.ceil(
        (policy.maturityDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      await this.createActionAndNotify(
        advisorUserId,
        'POLICY_RENEWAL',
        daysLeft <= 7 ? 'URGENT' : 'HIGH',
        `Health policy renewal in ${daysLeft} days: ${policy.provider}`,
        `${policy.client.name}'s ${policy.provider} health policy (${policy.policyNumber}) expires on ${policy.maturityDate?.toLocaleDateString('en-IN')}.`,
        policy.id,
        policy.maturityDate,
      );
    }

    // Life policies: maturity within 90 days
    const lifeMaturityDate = new Date(now);
    lifeMaturityDate.setDate(lifeMaturityDate.getDate() + 90);

    const lifeMaturities = await this.prisma.insurancePolicy.findMany({
      where: {
        status: 'ACTIVE',
        type: { notIn: HEALTH_TYPES },
        maturityDate: { gte: now, lte: lifeMaturityDate },
      },
      include: {
        client: { select: { advisorId: true, name: true } },
      },
    });

    for (const policy of lifeMaturities) {
      const advisorUserId = policy.client.advisorId;
      const daysLeft = Math.ceil(
        (policy.maturityDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      await this.createActionAndNotify(
        advisorUserId,
        'POLICY_MATURITY',
        daysLeft <= 30 ? 'HIGH' : 'MEDIUM',
        `Policy maturity in ${daysLeft} days: ${policy.provider}`,
        `${policy.client.name}'s ${policy.provider} policy (${policy.policyNumber}) matures on ${policy.maturityDate?.toLocaleDateString('en-IN')}.`,
        policy.id,
        policy.maturityDate,
      );
    }

    const total = healthRenewals.length + lifeMaturities.length;
    if (total > 0) {
      this.logger.log(`Found ${healthRenewals.length} health renewals and ${lifeMaturities.length} life maturities`);
    }
  }

  private async createActionAndNotify(
    userId: string,
    type: string,
    priority: string,
    title: string,
    description: string,
    referenceId: string,
    dueDate?: Date | null,
  ) {
    // Check for existing un-dismissed action to avoid duplicates
    const existing = await this.prisma.userAction.findFirst({
      where: {
        userId,
        type: type as any,
        referenceId,
        isDismissed: false,
        isCompleted: false,
      },
    });

    if (existing) return;

    await this.prisma.userAction.create({
      data: {
        userId,
        type: type as any,
        priority: priority as any,
        title,
        description,
        referenceId,
        dueDate,
      },
    });

    this.eventEmitter.emit('notification.insurance_reminders', {
      userId,
      category: 'INSURANCE_REMINDERS',
      title,
      body: description,
      metadata: { referenceId, type },
    });
  }
}
