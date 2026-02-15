import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInsurancePolicyDto } from './dto/create-insurance-policy.dto';
import { UpdateInsurancePolicyDto } from './dto/update-insurance-policy.dto';
import { RecordPremiumPaymentDto } from './dto/record-premium-payment.dto';

const LIFE_COVER_TYPES = ['TERM_LIFE', 'WHOLE_LIFE', 'ENDOWMENT', 'ULIP'];
const HEALTH_COVER_TYPES = ['HEALTH', 'CRITICAL_ILLNESS'];

@Injectable()
export class InsuranceService {
  constructor(private prisma: PrismaService) {}

  async findAll(clientId: string, advisorId: string) {
    await this.verifyClientOwnership(clientId, advisorId);

    const policies = await this.prisma.insurancePolicy.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });

    return policies.map(this.transformPolicy);
  }

  async create(clientId: string, advisorId: string, dto: CreateInsurancePolicyDto) {
    await this.verifyClientOwnership(clientId, advisorId);

    const startDate = new Date(dto.startDate);
    const frequency = dto.premiumFrequency || 'ANNUAL';
    const nextPremiumDate = this.calculateNextPremiumDate(startDate, frequency);

    const policy = await this.prisma.insurancePolicy.create({
      data: {
        clientId,
        policyNumber: dto.policyNumber,
        provider: dto.provider,
        type: dto.type,
        status: dto.status || 'ACTIVE',
        sumAssured: dto.sumAssured,
        premiumAmount: dto.premiumAmount,
        premiumFrequency: frequency,
        startDate,
        maturityDate: dto.maturityDate ? new Date(dto.maturityDate) : null,
        nominees: dto.nominees,
        notes: dto.notes,
        nextPremiumDate,
      },
    });

    return this.transformPolicy(policy);
  }

  async update(clientId: string, id: string, advisorId: string, dto: UpdateInsurancePolicyDto) {
    await this.verifyClientOwnership(clientId, advisorId);
    await this.findPolicyOrThrow(id, clientId);

    const data: any = {};
    if (dto.policyNumber !== undefined) data.policyNumber = dto.policyNumber;
    if (dto.provider !== undefined) data.provider = dto.provider;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.sumAssured !== undefined) data.sumAssured = dto.sumAssured;
    if (dto.premiumAmount !== undefined) data.premiumAmount = dto.premiumAmount;
    if (dto.premiumFrequency !== undefined) data.premiumFrequency = dto.premiumFrequency;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.maturityDate !== undefined) data.maturityDate = new Date(dto.maturityDate);
    if (dto.nominees !== undefined) data.nominees = dto.nominees;
    if (dto.notes !== undefined) data.notes = dto.notes;

    const policy = await this.prisma.insurancePolicy.update({
      where: { id },
      data,
    });

    return this.transformPolicy(policy);
  }

  async remove(clientId: string, id: string, advisorId: string) {
    await this.verifyClientOwnership(clientId, advisorId);
    await this.findPolicyOrThrow(id, clientId);

    await this.prisma.insurancePolicy.delete({ where: { id } });
    return { message: 'Policy deleted successfully' };
  }

  async gapAnalysis(
    clientId: string,
    advisorId: string,
    annualIncome?: number,
    age?: number,
    familySize?: number,
  ) {
    await this.verifyClientOwnership(clientId, advisorId);

    const policies = await this.prisma.insurancePolicy.findMany({
      where: { clientId, status: 'ACTIVE' },
    });

    // Life insurance gap (HLV method)
    const retirementAge = 60;
    const yearsToRetirement = age ? Math.max(retirementAge - age, 0) : 25;
    const lifeRecommended = annualIncome ? annualIncome * yearsToRetirement : 0;
    const lifeCurrent = policies
      .filter((p) => LIFE_COVER_TYPES.includes(p.type))
      .reduce((sum, p) => sum + Number(p.sumAssured), 0);
    const lifeGap = Math.max(lifeRecommended - lifeCurrent, 0);

    // Health insurance gap (family-size based)
    const effectiveFamilySize = familySize || 1;
    let healthRecommended: number;
    if (effectiveFamilySize <= 1) {
      healthRecommended = 500000;
    } else if (effectiveFamilySize <= 2) {
      healthRecommended = 1000000;
    } else if (effectiveFamilySize <= 4) {
      healthRecommended = 1500000;
    } else {
      healthRecommended = 2500000;
    }

    const healthCurrent = policies
      .filter((p) => HEALTH_COVER_TYPES.includes(p.type))
      .reduce((sum, p) => sum + Number(p.sumAssured), 0);
    const healthGap = Math.max(healthRecommended - healthCurrent, 0);

    return {
      life: {
        recommended: lifeRecommended,
        current: lifeCurrent,
        gap: lifeGap,
        adequate: lifeGap === 0,
      },
      health: {
        recommended: healthRecommended,
        current: healthCurrent,
        gap: Math.max(healthRecommended - healthCurrent, 0),
        adequate: healthCurrent >= healthRecommended,
      },
      policies: policies.map(this.transformPolicy),
    };
  }

  // ============= Premium Payment Methods =============

  async recordPayment(
    clientId: string,
    policyId: string,
    advisorId: string,
    dto: RecordPremiumPaymentDto,
  ) {
    await this.verifyClientOwnership(clientId, advisorId);
    const policy = await this.findPolicyOrThrow(policyId, clientId);

    const paymentDate = new Date(dto.paymentDate);

    const payment = await this.prisma.premiumPayment.create({
      data: {
        policyId,
        amountPaid: dto.amountPaid,
        paymentDate,
        paymentMode: dto.paymentMode,
        receiptNumber: dto.receiptNumber,
        notes: dto.notes,
      },
    });

    // Calculate next due date from payment date + frequency
    const nextPremiumDate = this.calculateNextPremiumDate(
      paymentDate,
      policy.premiumFrequency,
    );

    await this.prisma.insurancePolicy.update({
      where: { id: policyId },
      data: {
        lastPremiumDate: paymentDate,
        nextPremiumDate,
      },
    });

    return {
      id: payment.id,
      policyId: payment.policyId,
      amountPaid: Number(payment.amountPaid),
      paymentDate: payment.paymentDate,
      paymentMode: payment.paymentMode,
      receiptNumber: payment.receiptNumber,
      notes: payment.notes,
      createdAt: payment.createdAt,
    };
  }

  async getPaymentHistory(
    clientId: string,
    policyId: string,
    advisorId: string,
  ) {
    await this.verifyClientOwnership(clientId, advisorId);
    await this.findPolicyOrThrow(policyId, clientId);

    const payments = await this.prisma.premiumPayment.findMany({
      where: { policyId },
      orderBy: { paymentDate: 'desc' },
    });

    return payments.map((p) => ({
      id: p.id,
      policyId: p.policyId,
      amountPaid: Number(p.amountPaid),
      paymentDate: p.paymentDate,
      paymentMode: p.paymentMode,
      receiptNumber: p.receiptNumber,
      notes: p.notes,
      createdAt: p.createdAt,
    }));
  }

  async getUpcomingPremiums(
    clientId: string,
    advisorId: string,
    days = 30,
  ) {
    await this.verifyClientOwnership(clientId, advisorId);

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const policies = await this.prisma.insurancePolicy.findMany({
      where: {
        clientId,
        status: 'ACTIVE',
        nextPremiumDate: {
          lte: futureDate,
          not: null,
        },
      },
      orderBy: { nextPremiumDate: 'asc' },
    });

    return policies.map((p) => {
      const transformed = this.transformPolicy(p);
      const daysUntilDue = p.nextPremiumDate
        ? Math.ceil(
            (p.nextPremiumDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          )
        : null;
      return { ...transformed, daysUntilDue };
    });
  }

  // ============= Helpers =============

  calculateNextPremiumDate(
    fromDate: Date,
    frequency: string,
  ): Date | null {
    const next = new Date(fromDate);
    switch (frequency) {
      case 'MONTHLY':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'QUARTERLY':
        next.setMonth(next.getMonth() + 3);
        break;
      case 'HALF_YEARLY':
        next.setMonth(next.getMonth() + 6);
        break;
      case 'ANNUAL':
        next.setFullYear(next.getFullYear() + 1);
        break;
      case 'SINGLE':
        return null;
      default:
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    return next;
  }

  private async verifyClientOwnership(clientId: string, advisorId: string) {
    const client = await this.prisma.fAClient.findFirst({
      where: { id: clientId, advisorId },
    });
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    return client;
  }

  async findPolicyOrThrow(id: string, clientId: string) {
    const policy = await this.prisma.insurancePolicy.findFirst({
      where: { id, clientId },
    });
    if (!policy) {
      throw new NotFoundException('Insurance policy not found');
    }
    return policy;
  }

  private transformPolicy(policy: any) {
    return {
      id: policy.id,
      clientId: policy.clientId,
      policyNumber: policy.policyNumber,
      provider: policy.provider,
      type: policy.type,
      status: policy.status,
      sumAssured: Number(policy.sumAssured),
      premiumAmount: Number(policy.premiumAmount),
      premiumFrequency: policy.premiumFrequency,
      startDate: policy.startDate,
      maturityDate: policy.maturityDate,
      nextPremiumDate: policy.nextPremiumDate,
      lastPremiumDate: policy.lastPremiumDate,
      nominees: policy.nominees,
      notes: policy.notes,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
    };
  }
}
