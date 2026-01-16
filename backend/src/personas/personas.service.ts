import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MlGatewayService } from '../ml-gateway/ml-gateway.service';
import {
  CreatePersonaDto,
  UpdatePersonaDto,
  CreatePersonaRuleDto,
  CreatePersonaInsightDto,
  BulkCreatePersonaDto,
  SaveClassificationResultDto,
} from './dto/persona.dto';

@Injectable()
export class PersonasService {
  private readonly logger = new Logger(PersonasService.name);

  constructor(
    private prisma: PrismaService,
    private mlGatewayService: MlGatewayService,
  ) {}

  async findAll(includeInactive = false) {
    return this.prisma.persona.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        rules: { orderBy: { priority: 'desc' } },
        insights: { orderBy: { displayOrder: 'asc' } },
        _count: {
          select: {
            userProfiles: true,
            allocations: true,
          },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const persona = await this.prisma.persona.findUnique({
      where: { id },
      include: {
        rules: { orderBy: { priority: 'desc' } },
        insights: { orderBy: { displayOrder: 'asc' } },
        allocations: {
          where: { isActive: true },
          include: {
            components: { orderBy: { displayOrder: 'asc' } },
            constraints: true,
          },
        },
        mlMappings: {
          where: { isActive: true },
          include: { model: true },
        },
        _count: {
          select: { userProfiles: true },
        },
      },
    });

    if (!persona) {
      throw new NotFoundException(`Persona with ID ${id} not found`);
    }

    return persona;
  }

  async findBySlug(slug: string) {
    const persona = await this.prisma.persona.findUnique({
      where: { slug },
      include: {
        rules: { where: { isActive: true }, orderBy: { priority: 'desc' } },
        insights: { orderBy: { displayOrder: 'asc' } },
      },
    });

    if (!persona) {
      throw new NotFoundException(`Persona with slug ${slug} not found`);
    }

    return persona;
  }

  async create(dto: CreatePersonaDto) {
    const existingSlug = await this.prisma.persona.findUnique({
      where: { slug: dto.slug },
    });

    if (existingSlug) {
      throw new ConflictException(`Persona with slug ${dto.slug} already exists`);
    }

    return this.prisma.persona.create({
      data: dto,
      include: {
        rules: true,
        insights: true,
      },
    });
  }

  async bulkCreate(dto: BulkCreatePersonaDto) {
    const results = {
      created: [] as any[],
      failed: [] as Array<{ persona: CreatePersonaDto; error: string }>,
    };

    for (const personaDto of dto.personas) {
      try {
        const existingSlug = await this.prisma.persona.findUnique({
          where: { slug: personaDto.slug },
        });

        if (existingSlug) {
          results.failed.push({
            persona: personaDto,
            error: `Persona with slug ${personaDto.slug} already exists`,
          });
          continue;
        }

        const created = await this.prisma.persona.create({
          data: personaDto,
          include: {
            rules: true,
            insights: true,
          },
        });
        results.created.push(created);
      } catch (error) {
        results.failed.push({
          persona: personaDto,
          error: error.message || 'Unknown error',
        });
      }
    }

    return results;
  }

  async update(id: string, dto: UpdatePersonaDto) {
    await this.findOne(id); // Verify exists

    return this.prisma.persona.update({
      where: { id },
      data: dto,
      include: {
        rules: true,
        insights: true,
      },
    });
  }

  async delete(id: string) {
    await this.findOne(id); // Verify exists

    // Soft delete by setting isActive to false
    return this.prisma.persona.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDelete(id: string) {
    await this.findOne(id); // Verify exists

    return this.prisma.persona.delete({
      where: { id },
    });
  }

  async duplicate(id: string) {
    const original = await this.findOne(id);

    const newSlug = `${original.slug}-copy-${Date.now()}`;
    const newName = `${original.name} (Copy)`;

    return this.prisma.persona.create({
      data: {
        name: newName,
        slug: newSlug,
        description: original.description,
        riskBand: original.riskBand,
        iconName: original.iconName,
        colorPrimary: original.colorPrimary,
        colorSecondary: original.colorSecondary,
        displayOrder: original.displayOrder + 1,
        isActive: false, // Duplicates start inactive
        rules: {
          create: original.rules.map((rule) => ({
            ruleType: rule.ruleType,
            operator: rule.operator,
            value: rule.value as object,
            priority: rule.priority,
            isActive: rule.isActive,
          })),
        },
        insights: {
          create: original.insights.map((insight) => ({
            insightText: insight.insightText,
            displayOrder: insight.displayOrder,
          })),
        },
      },
      include: {
        rules: true,
        insights: true,
      },
    });
  }

  // Rules Management
  async addRule(personaId: string, dto: CreatePersonaRuleDto) {
    await this.findOne(personaId); // Verify persona exists

    return this.prisma.personaRule.create({
      data: {
        personaId,
        ...dto,
      },
    });
  }

  async updateRule(personaId: string, ruleId: string, dto: Partial<CreatePersonaRuleDto>) {
    const rule = await this.prisma.personaRule.findFirst({
      where: { id: ruleId, personaId },
    });

    if (!rule) {
      throw new NotFoundException(`Rule with ID ${ruleId} not found`);
    }

    return this.prisma.personaRule.update({
      where: { id: ruleId },
      data: dto,
    });
  }

  async deleteRule(personaId: string, ruleId: string) {
    const rule = await this.prisma.personaRule.findFirst({
      where: { id: ruleId, personaId },
    });

    if (!rule) {
      throw new NotFoundException(`Rule with ID ${ruleId} not found`);
    }

    return this.prisma.personaRule.delete({
      where: { id: ruleId },
    });
  }

  // Insights Management
  async addInsight(personaId: string, dto: CreatePersonaInsightDto) {
    await this.findOne(personaId); // Verify persona exists

    return this.prisma.personaInsight.create({
      data: {
        personaId,
        ...dto,
      },
    });
  }

  async updateInsight(personaId: string, insightId: string, dto: Partial<CreatePersonaInsightDto>) {
    const insight = await this.prisma.personaInsight.findFirst({
      where: { id: insightId, personaId },
    });

    if (!insight) {
      throw new NotFoundException(`Insight with ID ${insightId} not found`);
    }

    return this.prisma.personaInsight.update({
      where: { id: insightId },
      data: dto,
    });
  }

  async deleteInsight(personaId: string, insightId: string) {
    const insight = await this.prisma.personaInsight.findFirst({
      where: { id: insightId, personaId },
    });

    if (!insight) {
      throw new NotFoundException(`Insight with ID ${insightId} not found`);
    }

    return this.prisma.personaInsight.delete({
      where: { id: insightId },
    });
  }

  // Classify a profile to a persona based on rules
  async classifyProfile(profile: {
    horizonYears?: number;
    liquidity?: string;
    riskTolerance?: string;
    volatility?: string;
    knowledge?: string;
  }) {
    const personas = await this.prisma.persona.findMany({
      where: { isActive: true },
      include: {
        rules: {
          where: { isActive: true },
          orderBy: { priority: 'desc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    for (const persona of personas) {
      if (this.matchesRules(profile, persona.rules)) {
        return persona;
      }
    }

    // Return default (first active persona) if no match
    return personas[0] || null;
  }

  private matchesRules(
    profile: Record<string, any>,
    rules: Array<{ ruleType: string; operator: string; value: any }>,
  ): boolean {
    if (rules.length === 0) return false;

    for (const rule of rules) {
      const profileValue = this.getProfileValue(profile, rule.ruleType);
      if (profileValue === undefined) continue;

      if (this.evaluateRule(profileValue, rule.operator, rule.value)) {
        return true; // OR logic - any rule match is sufficient
      }
    }

    return false;
  }

  private getProfileValue(profile: Record<string, any>, ruleType: string): any {
    const mapping: Record<string, string> = {
      horizon: 'horizonYears',
      liquidity: 'liquidity',
      risk_tolerance: 'riskTolerance',
      volatility: 'volatility',
      knowledge: 'knowledge',
    };
    return profile[mapping[ruleType] || ruleType];
  }

  private evaluateRule(profileValue: any, operator: string, ruleValue: any): boolean {
    switch (operator) {
      case 'eq':
        return profileValue === ruleValue;
      case 'lte':
        return profileValue <= ruleValue;
      case 'gte':
        return profileValue >= ruleValue;
      case 'lt':
        return profileValue < ruleValue;
      case 'gt':
        return profileValue > ruleValue;
      case 'in':
        return Array.isArray(ruleValue) && ruleValue.includes(profileValue);
      default:
        return false;
    }
  }

  // Classification result saving (uses blended ML classification when available)
  async classifyAndSave(dto: SaveClassificationResultDto) {
    const startTime = Date.now();

    // Try to use ML service for blended classification
    let blendedResult: any = null;
    let primaryPersona: any = null;
    let confidence: number;
    let distribution: Record<string, number> = {};
    let blendedAllocation: Record<string, number> = {};

    try {
      // Call the ML service for blended classification
      const mlRequest = {
        request_id: `classify-${Date.now()}`,
        profile: {
          age: dto.age || 30,
          goal: '',
          target_amount: dto.targetAmount || 0,
          target_year: 0,
          monthly_sip: dto.monthlySip || 0,
          lump_sum: 0,
          liquidity: dto.profile.liquidity || 'Medium',
          risk_tolerance: dto.profile.riskTolerance || 'Moderate',
          knowledge: dto.profile.knowledge || 'Intermediate',
          volatility: dto.profile.volatility || 'Medium',
          horizon_years: dto.profile.horizonYears || 5,
        },
      };

      blendedResult = await this.mlGatewayService.classifyProfileBlended(mlRequest as any);
      confidence = blendedResult.confidence;

      // Build distribution from ML result
      for (const item of blendedResult.distribution) {
        distribution[item.persona.slug] = item.weight;
      }

      // Get blended allocation
      blendedAllocation = blendedResult.blended_allocation;

      // Get primary persona from DB
      primaryPersona = await this.prisma.persona.findFirst({
        where: { slug: blendedResult.primary_persona.slug, isActive: true },
        include: {
          rules: { where: { isActive: true }, orderBy: { priority: 'desc' } },
          insights: { orderBy: { displayOrder: 'asc' } },
        },
      });

      this.logger.log(`ML blended classification: ${blendedResult.primary_persona.slug} (${(confidence * 100).toFixed(1)}%)`);
    } catch (error) {
      this.logger.warn(`ML classification failed, falling back to rules: ${error.message}`);

      // Fallback to rules-based classification
      primaryPersona = await this.classifyProfile(dto.profile);
      if (!primaryPersona) {
        throw new NotFoundException('No matching persona found');
      }
      confidence = this.calculateConfidence(dto.profile, primaryPersona);
    }

    if (!primaryPersona) {
      throw new NotFoundException('No matching persona found');
    }

    const latencyMs = Date.now() - startTime;

    // Create inference log
    const inferenceLog = await this.prisma.mlInferenceLog.create({
      data: {
        inputFeatures: dto.profile as any,
        prediction: {
          personaId: primaryPersona.id,
          personaSlug: primaryPersona.slug,
          distribution,
          blendedAllocation,
        },
        confidence,
        latencyMs,
      },
    });

    // If email is provided, create or update user and profile
    let profileId: string | undefined;
    if (dto.email) {
      const userAndProfile = await this.createOrUpdateUserProfile(
        dto,
        primaryPersona.id,
        distribution,
        blendedAllocation,
      );
      if (userAndProfile.profile) {
        profileId = userAndProfile.profile.id;
      }

      // Update inference log with user reference
      if (userAndProfile.user) {
        await this.prisma.mlInferenceLog.update({
          where: { id: inferenceLog.id },
          data: { userId: userAndProfile.user.id },
        });
      }
    }

    return {
      persona: primaryPersona,
      confidence,
      method: blendedResult ? 'ml-blended' : 'rules',
      profileId,
      inferenceLogId: inferenceLog.id,
      distribution: blendedResult ? distribution : undefined,
      blendedAllocation: blendedResult ? blendedAllocation : undefined,
    };
  }

  private calculateConfidence(
    profile: Record<string, any>,
    persona: { rules: Array<{ ruleType: string; operator: string; value: any }> },
  ): number {
    if (!persona.rules || persona.rules.length === 0) {
      return 0.5; // Default confidence when no rules
    }

    let matchedRules = 0;
    let totalApplicableRules = 0;

    for (const rule of persona.rules) {
      const profileValue = this.getProfileValue(profile, rule.ruleType);
      if (profileValue !== undefined) {
        totalApplicableRules++;
        if (this.evaluateRule(profileValue, rule.operator, rule.value)) {
          matchedRules++;
        }
      }
    }

    if (totalApplicableRules === 0) {
      return 0.5;
    }

    // Base confidence from rule matching
    const ruleConfidence = matchedRules / totalApplicableRules;

    // Scale to 0.6-1.0 range (never show low confidence for rule matches)
    return 0.6 + (ruleConfidence * 0.4);
  }

  private async createOrUpdateUserProfile(
    dto: SaveClassificationResultDto,
    personaId: string,
    distribution?: Record<string, number>,
    blendedAllocation?: Record<string, number>,
  ) {
    const method = distribution && Object.keys(distribution).length > 0 ? 'ml-blended' : 'rules';

    // If no email provided, skip user creation
    if (!dto.email) {
      return { user: null, profile: null };
    }

    // Check if user exists
    let user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { profile: true },
    });

    if (!user) {
      // Create new user with profile
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash: '', // Empty hash for classification-only users
          isActive: true,
          isVerified: false,
          role: 'user',
          profile: {
            create: {
              name: dto.name || 'Anonymous',
              age: dto.age,
              horizonYears: dto.profile.horizonYears,
              liquidity: dto.profile.liquidity,
              riskTolerance: dto.profile.riskTolerance,
              volatility: dto.profile.volatility,
              knowledge: dto.profile.knowledge,
              targetAmount: dto.targetAmount,
              monthlySip: dto.monthlySip,
              assignedPersonaId: personaId,
              personaAssignedAt: new Date(),
              personaMethod: method,
              personaDistribution: distribution || undefined,
              blendedAllocation: blendedAllocation || undefined,
            },
          },
        },
        include: { profile: true },
      });
    } else {
      // Update existing user's profile
      if (user.profile) {
        await this.prisma.userProfile.update({
          where: { id: user.profile.id },
          data: {
            name: dto.name || user.profile.name,
            age: dto.age ?? user.profile.age,
            horizonYears: dto.profile.horizonYears ?? user.profile.horizonYears,
            liquidity: dto.profile.liquidity ?? user.profile.liquidity,
            riskTolerance: dto.profile.riskTolerance ?? user.profile.riskTolerance,
            volatility: dto.profile.volatility ?? user.profile.volatility,
            knowledge: dto.profile.knowledge ?? user.profile.knowledge,
            targetAmount: dto.targetAmount ?? user.profile.targetAmount,
            monthlySip: dto.monthlySip ?? user.profile.monthlySip,
            assignedPersonaId: personaId,
            personaAssignedAt: new Date(),
            personaMethod: method,
            personaDistribution: distribution || undefined,
            blendedAllocation: blendedAllocation || undefined,
          },
        });
      } else {
        // Create profile for existing user
        await this.prisma.userProfile.create({
          data: {
            userId: user.id,
            name: dto.name || 'Anonymous',
            age: dto.age,
            horizonYears: dto.profile.horizonYears,
            liquidity: dto.profile.liquidity,
            riskTolerance: dto.profile.riskTolerance,
            volatility: dto.profile.volatility,
            knowledge: dto.profile.knowledge,
            targetAmount: dto.targetAmount,
            monthlySip: dto.monthlySip,
            assignedPersonaId: personaId,
            personaAssignedAt: new Date(),
            personaMethod: method,
            personaDistribution: distribution || undefined,
            blendedAllocation: blendedAllocation || undefined,
          },
        });
      }

      // Re-fetch user with updated profile
      user = await this.prisma.user.findUnique({
        where: { email: dto.email },
        include: { profile: true },
      });
    }

    return { user, profile: user?.profile || null };
  }

  // Get all classification results (inference logs)
  async getClassificationResults(options?: {
    personaId?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.prisma.mlInferenceLog.findMany({
      where: options?.personaId
        ? {
            prediction: {
              path: ['personaId'],
              equals: options.personaId,
            },
          }
        : {},
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                name: true,
                age: true,
              },
            },
          },
        },
      },
    });
  }

  // Get classification stats by persona
  async getClassificationStats() {
    const personas = await this.prisma.persona.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: { userProfiles: true },
        },
      },
    });

    const totalClassifications = await this.prisma.mlInferenceLog.count();

    return {
      personas: personas.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        userCount: p._count.userProfiles,
      })),
      totalClassifications,
    };
  }
}
