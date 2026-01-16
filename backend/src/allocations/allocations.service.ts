import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAllocationStrategyDto,
  UpdateAllocationStrategyDto,
  CreateAllocationComponentDto,
  CreateRiskConstraintDto,
} from './dto/allocation.dto';

@Injectable()
export class AllocationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(personaId?: string) {
    return this.prisma.allocationStrategy.findMany({
      where: personaId ? { personaId } : {},
      include: {
        persona: { select: { id: true, name: true, slug: true } },
        components: { orderBy: { displayOrder: 'asc' } },
        constraints: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const strategy = await this.prisma.allocationStrategy.findUnique({
      where: { id },
      include: {
        persona: true,
        components: { orderBy: { displayOrder: 'asc' } },
        constraints: true,
      },
    });

    if (!strategy) {
      throw new NotFoundException(`Allocation strategy with ID ${id} not found`);
    }

    return strategy;
  }

  async create(dto: CreateAllocationStrategyDto) {
    return this.prisma.allocationStrategy.create({
      data: dto,
      include: {
        persona: { select: { id: true, name: true } },
        components: true,
        constraints: true,
      },
    });
  }

  async update(id: string, dto: UpdateAllocationStrategyDto) {
    await this.findOne(id);

    return this.prisma.allocationStrategy.update({
      where: { id },
      data: dto,
      include: {
        persona: { select: { id: true, name: true } },
        components: { orderBy: { displayOrder: 'asc' } },
        constraints: true,
      },
    });
  }

  async delete(id: string) {
    await this.findOne(id);

    return this.prisma.allocationStrategy.delete({
      where: { id },
    });
  }

  // Components
  async addComponent(strategyId: string, dto: CreateAllocationComponentDto) {
    await this.findOne(strategyId);

    return this.prisma.allocationComponent.create({
      data: {
        strategyId,
        ...dto,
      },
    });
  }

  async updateComponent(
    strategyId: string,
    componentId: string,
    dto: Partial<CreateAllocationComponentDto>,
  ) {
    const component = await this.prisma.allocationComponent.findFirst({
      where: { id: componentId, strategyId },
    });

    if (!component) {
      throw new NotFoundException(`Component with ID ${componentId} not found`);
    }

    return this.prisma.allocationComponent.update({
      where: { id: componentId },
      data: dto,
    });
  }

  async deleteComponent(strategyId: string, componentId: string) {
    const component = await this.prisma.allocationComponent.findFirst({
      where: { id: componentId, strategyId },
    });

    if (!component) {
      throw new NotFoundException(`Component with ID ${componentId} not found`);
    }

    return this.prisma.allocationComponent.delete({
      where: { id: componentId },
    });
  }

  // Constraints
  async addConstraint(strategyId: string, dto: CreateRiskConstraintDto) {
    await this.findOne(strategyId);

    return this.prisma.riskConstraint.create({
      data: {
        strategyId,
        ...dto,
      },
    });
  }

  async updateConstraint(
    strategyId: string,
    constraintId: string,
    dto: Partial<CreateRiskConstraintDto>,
  ) {
    const constraint = await this.prisma.riskConstraint.findFirst({
      where: { id: constraintId, strategyId },
    });

    if (!constraint) {
      throw new NotFoundException(`Constraint with ID ${constraintId} not found`);
    }

    return this.prisma.riskConstraint.update({
      where: { id: constraintId },
      data: dto,
    });
  }

  async deleteConstraint(strategyId: string, constraintId: string) {
    const constraint = await this.prisma.riskConstraint.findFirst({
      where: { id: constraintId, strategyId },
    });

    if (!constraint) {
      throw new NotFoundException(`Constraint with ID ${constraintId} not found`);
    }

    return this.prisma.riskConstraint.delete({
      where: { id: constraintId },
    });
  }

  // Get active allocation for a persona
  async getActiveAllocationForPersona(personaId: string) {
    return this.prisma.allocationStrategy.findFirst({
      where: {
        personaId,
        isActive: true,
      },
      include: {
        components: { orderBy: { displayOrder: 'asc' } },
        constraints: true,
      },
      orderBy: { version: 'desc' },
    });
  }
}
