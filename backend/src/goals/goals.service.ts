import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto, UpdateGoalDto, AddContributionDto, GoalResponseDto } from './dto/goal.dto';
import { GoalStatus } from '@prisma/client';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  private toResponseDto(goal: any): GoalResponseDto {
    const targetDate = new Date(goal.targetDate);
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const progress = Number(goal.targetAmount) > 0
      ? Math.min(100, (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100)
      : 0;

    return {
      id: goal.id,
      name: goal.name,
      category: goal.category,
      icon: goal.icon,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount),
      targetDate: goal.targetDate.toISOString().split('T')[0],
      monthlySip: goal.monthlySip ? Number(goal.monthlySip) : null,
      status: goal.status,
      priority: goal.priority,
      linkedFundCodes: goal.linkedFundCodes || [],
      notes: goal.notes,
      progress: Math.round(progress * 100) / 100,
      daysRemaining,
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),
    };
  }

  async findAllByUser(userId: string): Promise<GoalResponseDto[]> {
    const goals = await this.prisma.userGoal.findMany({
      where: { userId },
      orderBy: [
        { status: 'asc' }, // Active goals first
        { priority: 'asc' },
        { targetDate: 'asc' },
      ],
    });

    return goals.map(goal => this.toResponseDto(goal));
  }

  async findOne(userId: string, goalId: string): Promise<GoalResponseDto> {
    const goal = await this.prisma.userGoal.findUnique({
      where: { id: goalId },
      include: {
        contributions: {
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    if (goal.userId !== userId) {
      throw new ForbiddenException('You do not have access to this goal');
    }

    return this.toResponseDto(goal);
  }

  async create(userId: string, dto: CreateGoalDto): Promise<GoalResponseDto> {
    // Check if user has an associated FAClient
    const client = await this.prisma.fAClient.findFirst({
      where: { userId },
    });

    const goal = await this.prisma.userGoal.create({
      data: {
        userId,
        clientId: client?.id || null,
        name: dto.name,
        category: dto.category,
        icon: dto.icon,
        targetAmount: dto.targetAmount,
        currentAmount: dto.currentAmount || 0,
        targetDate: new Date(dto.targetDate),
        monthlySip: dto.monthlySip,
        priority: dto.priority || 1,
        linkedFundCodes: dto.linkedFundCodes || [],
        notes: dto.notes,
        status: GoalStatus.ACTIVE,
      },
    });

    return this.toResponseDto(goal);
  }

  async update(userId: string, goalId: string, dto: UpdateGoalDto): Promise<GoalResponseDto> {
    // Verify ownership
    const existing = await this.prisma.userGoal.findUnique({
      where: { id: goalId },
    });

    if (!existing) {
      throw new NotFoundException('Goal not found');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('You do not have access to this goal');
    }

    const updateData: any = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.icon !== undefined) updateData.icon = dto.icon;
    if (dto.targetAmount !== undefined) updateData.targetAmount = dto.targetAmount;
    if (dto.currentAmount !== undefined) updateData.currentAmount = dto.currentAmount;
    if (dto.targetDate !== undefined) updateData.targetDate = new Date(dto.targetDate);
    if (dto.monthlySip !== undefined) updateData.monthlySip = dto.monthlySip;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.linkedFundCodes !== undefined) updateData.linkedFundCodes = dto.linkedFundCodes;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const goal = await this.prisma.userGoal.update({
      where: { id: goalId },
      data: updateData,
    });

    return this.toResponseDto(goal);
  }

  async delete(userId: string, goalId: string): Promise<void> {
    const existing = await this.prisma.userGoal.findUnique({
      where: { id: goalId },
    });

    if (!existing) {
      throw new NotFoundException('Goal not found');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('You do not have access to this goal');
    }

    await this.prisma.userGoal.delete({
      where: { id: goalId },
    });
  }

  async addContribution(userId: string, goalId: string, dto: AddContributionDto): Promise<GoalResponseDto> {
    // Verify ownership
    const existing = await this.prisma.userGoal.findUnique({
      where: { id: goalId },
    });

    if (!existing) {
      throw new NotFoundException('Goal not found');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('You do not have access to this goal');
    }

    // Create contribution and update goal's current amount
    await this.prisma.$transaction([
      this.prisma.goalContribution.create({
        data: {
          goalId,
          amount: dto.amount,
          type: dto.type,
          date: new Date(dto.date),
          description: dto.description,
        },
      }),
      this.prisma.userGoal.update({
        where: { id: goalId },
        data: {
          currentAmount: {
            increment: dto.amount,
          },
        },
      }),
    ]);

    // Check if goal is now completed
    const updatedGoal = await this.prisma.userGoal.findUnique({
      where: { id: goalId },
    });

    if (updatedGoal && Number(updatedGoal.currentAmount) >= Number(updatedGoal.targetAmount)) {
      await this.prisma.userGoal.update({
        where: { id: goalId },
        data: { status: GoalStatus.COMPLETED },
      });
    }

    const finalGoal = await this.prisma.userGoal.findUnique({
      where: { id: goalId },
    });

    return this.toResponseDto(finalGoal);
  }

  async getContributions(userId: string, goalId: string) {
    const goal = await this.prisma.userGoal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    if (goal.userId !== userId) {
      throw new ForbiddenException('You do not have access to this goal');
    }

    const contributions = await this.prisma.goalContribution.findMany({
      where: { goalId },
      orderBy: { date: 'desc' },
    });

    return contributions.map(c => ({
      id: c.id,
      amount: Number(c.amount),
      type: c.type,
      date: c.date.toISOString().split('T')[0],
      description: c.description,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  // ============================================================
  // FA-specific methods (for Financial Advisors managing client goals)
  // ============================================================

  private async verifyClientAccess(clientId: string, advisorId: string) {
    const client = await this.prisma.fAClient.findFirst({
      where: { id: clientId, advisorId },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    return client;
  }

  async findAllByClient(clientId: string, advisorId: string): Promise<GoalResponseDto[]> {
    await this.verifyClientAccess(clientId, advisorId);

    const goals = await this.prisma.userGoal.findMany({
      where: { clientId },
      orderBy: [
        { status: 'asc' },
        { priority: 'asc' },
        { targetDate: 'asc' },
      ],
    });

    return goals.map(goal => this.toResponseDto(goal));
  }

  async findOneByClient(clientId: string, goalId: string, advisorId: string): Promise<GoalResponseDto> {
    await this.verifyClientAccess(clientId, advisorId);

    const goal = await this.prisma.userGoal.findUnique({
      where: { id: goalId },
      include: {
        contributions: {
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    if (goal.clientId !== clientId) {
      throw new ForbiddenException('Goal does not belong to this client');
    }

    return this.toResponseDto(goal);
  }

  async createForClient(clientId: string, advisorId: string, dto: CreateGoalDto): Promise<GoalResponseDto> {
    const client = await this.verifyClientAccess(clientId, advisorId);

    // Get the userId from the client if they have an associated user account
    const userId = client.userId;

    if (!userId) {
      throw new ForbiddenException('Client does not have an associated user account');
    }

    const goal = await this.prisma.userGoal.create({
      data: {
        userId,
        clientId,
        name: dto.name,
        category: dto.category,
        icon: dto.icon,
        targetAmount: dto.targetAmount,
        currentAmount: dto.currentAmount || 0,
        targetDate: new Date(dto.targetDate),
        monthlySip: dto.monthlySip,
        priority: dto.priority || 1,
        linkedFundCodes: dto.linkedFundCodes || [],
        notes: dto.notes,
        status: GoalStatus.ACTIVE,
      },
    });

    return this.toResponseDto(goal);
  }

  async updateForClient(
    clientId: string,
    goalId: string,
    advisorId: string,
    dto: UpdateGoalDto,
  ): Promise<GoalResponseDto> {
    await this.verifyClientAccess(clientId, advisorId);

    const existing = await this.prisma.userGoal.findUnique({
      where: { id: goalId },
    });

    if (!existing) {
      throw new NotFoundException('Goal not found');
    }

    if (existing.clientId !== clientId) {
      throw new ForbiddenException('Goal does not belong to this client');
    }

    const updateData: any = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.icon !== undefined) updateData.icon = dto.icon;
    if (dto.targetAmount !== undefined) updateData.targetAmount = dto.targetAmount;
    if (dto.currentAmount !== undefined) updateData.currentAmount = dto.currentAmount;
    if (dto.targetDate !== undefined) updateData.targetDate = new Date(dto.targetDate);
    if (dto.monthlySip !== undefined) updateData.monthlySip = dto.monthlySip;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.linkedFundCodes !== undefined) updateData.linkedFundCodes = dto.linkedFundCodes;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const goal = await this.prisma.userGoal.update({
      where: { id: goalId },
      data: updateData,
    });

    return this.toResponseDto(goal);
  }

  async deleteForClient(clientId: string, goalId: string, advisorId: string): Promise<void> {
    await this.verifyClientAccess(clientId, advisorId);

    const existing = await this.prisma.userGoal.findUnique({
      where: { id: goalId },
    });

    if (!existing) {
      throw new NotFoundException('Goal not found');
    }

    if (existing.clientId !== clientId) {
      throw new ForbiddenException('Goal does not belong to this client');
    }

    await this.prisma.userGoal.delete({
      where: { id: goalId },
    });
  }

  async addContributionForClient(
    clientId: string,
    goalId: string,
    advisorId: string,
    dto: AddContributionDto,
  ): Promise<GoalResponseDto> {
    await this.verifyClientAccess(clientId, advisorId);

    const existing = await this.prisma.userGoal.findUnique({
      where: { id: goalId },
    });

    if (!existing) {
      throw new NotFoundException('Goal not found');
    }

    if (existing.clientId !== clientId) {
      throw new ForbiddenException('Goal does not belong to this client');
    }

    // Create contribution and update goal's current amount
    await this.prisma.$transaction([
      this.prisma.goalContribution.create({
        data: {
          goalId,
          amount: dto.amount,
          type: dto.type,
          date: new Date(dto.date),
          description: dto.description,
        },
      }),
      this.prisma.userGoal.update({
        where: { id: goalId },
        data: {
          currentAmount: {
            increment: dto.amount,
          },
        },
      }),
    ]);

    // Check if goal is now completed
    const updatedGoal = await this.prisma.userGoal.findUnique({
      where: { id: goalId },
    });

    if (updatedGoal && Number(updatedGoal.currentAmount) >= Number(updatedGoal.targetAmount)) {
      await this.prisma.userGoal.update({
        where: { id: goalId },
        data: { status: GoalStatus.COMPLETED },
      });
    }

    const finalGoal = await this.prisma.userGoal.findUnique({
      where: { id: goalId },
    });

    return this.toResponseDto(finalGoal);
  }

  async getContributionsForClient(clientId: string, goalId: string, advisorId: string) {
    await this.verifyClientAccess(clientId, advisorId);

    const goal = await this.prisma.userGoal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    if (goal.clientId !== clientId) {
      throw new ForbiddenException('Goal does not belong to this client');
    }

    const contributions = await this.prisma.goalContribution.findMany({
      where: { goalId },
      orderBy: { date: 'desc' },
    });

    return contributions.map(c => ({
      id: c.id,
      amount: Number(c.amount),
      type: c.type,
      date: c.date.toISOString().split('T')[0],
      description: c.description,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  // ============================================================
  // Goal Asset Mapping (Multi-Asset Planning)
  // ============================================================

  async getAssetMappings(clientId: string, goalId: string, advisorId: string) {
    await this.verifyClientAccess(clientId, advisorId);
    const goal = await this.prisma.userGoal.findUnique({ where: { id: goalId } });
    if (!goal || goal.clientId !== clientId) throw new NotFoundException('Goal not found');

    const mappings = await this.prisma.goalAssetMapping.findMany({
      where: { goalId },
      orderBy: { createdAt: 'asc' },
    });

    return mappings.map(m => ({
      id: m.id,
      goalId: m.goalId,
      assetType: m.assetType,
      schemeCode: m.schemeCode,
      schemeName: m.schemeName,
      folioNumber: m.folioNumber,
      assetName: m.assetName,
      assetIdentifier: m.assetIdentifier,
      allocationPct: Number(m.allocationPct),
      currentValue: m.currentValue ? Number(m.currentValue) : null,
      notes: m.notes,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }));
  }

  async addAssetMapping(clientId: string, goalId: string, advisorId: string, data: {
    assetType: string; schemeCode?: string; schemeName?: string; folioNumber?: string;
    assetName?: string; assetIdentifier?: string; allocationPct: number; currentValue?: number; notes?: string;
  }) {
    await this.verifyClientAccess(clientId, advisorId);
    const goal = await this.prisma.userGoal.findUnique({ where: { id: goalId } });
    if (!goal || goal.clientId !== clientId) throw new NotFoundException('Goal not found');

    const mapping = await this.prisma.goalAssetMapping.create({
      data: {
        goalId,
        assetType: data.assetType as any,
        schemeCode: data.schemeCode || null,
        schemeName: data.schemeName || null,
        folioNumber: data.folioNumber || null,
        assetName: data.assetName || null,
        assetIdentifier: data.assetIdentifier || null,
        allocationPct: data.allocationPct,
        currentValue: data.currentValue ?? null,
        notes: data.notes || null,
      },
    });

    return {
      id: mapping.id,
      goalId: mapping.goalId,
      assetType: mapping.assetType,
      allocationPct: Number(mapping.allocationPct),
      currentValue: mapping.currentValue ? Number(mapping.currentValue) : null,
      createdAt: mapping.createdAt.toISOString(),
    };
  }

  async updateAssetMapping(clientId: string, goalId: string, mappingId: string, advisorId: string, data: {
    assetType?: string; schemeCode?: string; schemeName?: string; assetName?: string;
    allocationPct?: number; currentValue?: number; notes?: string;
  }) {
    await this.verifyClientAccess(clientId, advisorId);

    const mapping = await this.prisma.goalAssetMapping.findUnique({ where: { id: mappingId } });
    if (!mapping || mapping.goalId !== goalId) throw new NotFoundException('Asset mapping not found');

    const updateData: any = {};
    if (data.assetType !== undefined) updateData.assetType = data.assetType;
    if (data.schemeCode !== undefined) updateData.schemeCode = data.schemeCode;
    if (data.schemeName !== undefined) updateData.schemeName = data.schemeName;
    if (data.assetName !== undefined) updateData.assetName = data.assetName;
    if (data.allocationPct !== undefined) updateData.allocationPct = data.allocationPct;
    if (data.currentValue !== undefined) updateData.currentValue = data.currentValue;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const updated = await this.prisma.goalAssetMapping.update({
      where: { id: mappingId },
      data: updateData,
    });

    return {
      id: updated.id,
      goalId: updated.goalId,
      assetType: updated.assetType,
      allocationPct: Number(updated.allocationPct),
      currentValue: updated.currentValue ? Number(updated.currentValue) : null,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async removeAssetMapping(clientId: string, goalId: string, mappingId: string, advisorId: string) {
    await this.verifyClientAccess(clientId, advisorId);

    const mapping = await this.prisma.goalAssetMapping.findUnique({ where: { id: mappingId } });
    if (!mapping || mapping.goalId !== goalId) throw new NotFoundException('Asset mapping not found');

    await this.prisma.goalAssetMapping.delete({ where: { id: mappingId } });
    return { message: 'Asset mapping removed' };
  }

  async computeShortfall(clientId: string, goalId: string, advisorId: string) {
    await this.verifyClientAccess(clientId, advisorId);

    const goal = await this.prisma.userGoal.findUnique({
      where: { id: goalId },
      include: { client: true },
    });
    if (!goal || goal.clientId !== clientId) throw new NotFoundException('Goal not found');

    const mappings = await this.prisma.goalAssetMapping.findMany({ where: { goalId } });

    // For MF mappings, look up live value from FAHolding
    let mappedValue = 0;
    for (const m of mappings) {
      if (m.assetType === 'MUTUAL_FUND' && m.schemeCode && m.folioNumber) {
        const holding = await this.prisma.fAHolding.findFirst({
          where: { clientId, fundSchemeCode: m.schemeCode, folioNumber: m.folioNumber },
        });
        if (holding) {
          mappedValue += Number(holding.currentValue) * (Number(m.allocationPct) / 100);
        }
      } else if (m.currentValue) {
        mappedValue += Number(m.currentValue) * (Number(m.allocationPct) / 100);
      }
    }

    const targetAmount = Number(goal.targetAmount);
    const shortfall = Math.max(0, targetAmount - mappedValue);
    const shortfallPct = targetAmount > 0 ? Math.round((shortfall / targetAmount) * 10000) / 100 : 0;

    // Year-by-year projections (simple growth at 10% p.a.)
    const monthsToTarget = Math.max(0, Math.ceil(
      (new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30),
    ));
    const yearsToTarget = Math.ceil(monthsToTarget / 12);
    const growthRate = 0.10;

    const projections: { year: number; projectedValue: number; targetValue: number }[] = [];
    for (let y = 0; y <= yearsToTarget; y++) {
      projections.push({
        year: new Date().getFullYear() + y,
        projectedValue: Math.round(mappedValue * Math.pow(1 + growthRate, y)),
        targetValue: targetAmount,
      });
    }

    return {
      goalId,
      goalName: goal.name,
      targetAmount,
      mappedValue: Math.round(mappedValue),
      shortfall: Math.round(shortfall),
      shortfallPct,
      assetCount: mappings.length,
      projections,
    };
  }

  // Get all goals across all clients for an advisor (for dashboard)
  async findAllByAdvisor(advisorId: string): Promise<GoalResponseDto[]> {
    const goals = await this.prisma.userGoal.findMany({
      where: {
        client: {
          advisorId,
        },
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'asc' },
        { targetDate: 'asc' },
      ],
    });

    return goals.map(goal => ({
      ...this.toResponseDto(goal),
      clientId: goal.clientId,
      clientName: goal.client?.name || '',
    }));
  }
}
