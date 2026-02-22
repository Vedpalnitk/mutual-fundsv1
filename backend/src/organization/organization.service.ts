import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateArnDto, UpdateArnDto } from './dto'

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  async listArns(advisorId: string) {
    const arns = await this.prisma.organizationArn.findMany({
      where: { advisorId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    })

    // Auto-create from AdvisorProfile.arnNo if none exist
    if (arns.length === 0) {
      const profile = await this.prisma.advisorProfile.findUnique({
        where: { userId: advisorId },
      })
      if (profile?.arnNo) {
        const created = await this.prisma.organizationArn.create({
          data: {
            advisorId,
            arnNumber: profile.arnNo,
            label: 'Primary',
            isDefault: true,
          },
        })
        return [created]
      }
    }

    return arns
  }

  async addArn(advisorId: string, dto: CreateArnDto) {
    const existing = await this.prisma.organizationArn.findUnique({
      where: { advisorId_arnNumber: { advisorId, arnNumber: dto.arnNumber } },
    })
    if (existing) {
      throw new ConflictException('ARN already registered')
    }

    // If this is the first ARN, make it default
    const count = await this.prisma.organizationArn.count({ where: { advisorId } })
    const isDefault = count === 0

    return this.prisma.organizationArn.create({
      data: {
        advisorId,
        arnNumber: dto.arnNumber,
        label: dto.label || null,
        isDefault,
      },
    })
  }

  async updateArn(id: string, advisorId: string, dto: UpdateArnDto) {
    const arn = await this.prisma.organizationArn.findFirst({
      where: { id, advisorId },
    })
    if (!arn) throw new NotFoundException('ARN not found')

    // If setting as default, unset other defaults first
    if (dto.isDefault === true) {
      await this.prisma.organizationArn.updateMany({
        where: { advisorId, isDefault: true },
        data: { isDefault: false },
      })
    }

    // Don't allow unsetting default if it's the only active ARN
    if (dto.isDefault === false && arn.isDefault) {
      const activeCount = await this.prisma.organizationArn.count({
        where: { advisorId, isActive: true },
      })
      if (activeCount <= 1) {
        throw new BadRequestException('At least one ARN must be set as default')
      }
    }

    return this.prisma.organizationArn.update({
      where: { id },
      data: {
        ...(dto.label !== undefined && { label: dto.label }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    })
  }

  async deleteArn(id: string, advisorId: string) {
    const arn = await this.prisma.organizationArn.findFirst({
      where: { id, advisorId },
    })
    if (!arn) throw new NotFoundException('ARN not found')

    if (arn.isDefault) {
      throw new BadRequestException('Cannot delete the default ARN. Set another ARN as default first.')
    }

    return this.prisma.organizationArn.update({
      where: { id },
      data: { isActive: false },
    })
  }

  async getDashboard(advisorId: string) {
    const [arns, staffMembers, clients, commissionRecords] = await Promise.all([
      this.prisma.organizationArn.findMany({
        where: { advisorId, isActive: true },
      }),
      this.prisma.fAStaffMember.findMany({
        where: { ownerId: advisorId, isActive: true },
        include: {
          assignedClients: {
            include: { holdings: true },
          },
        },
      }),
      this.prisma.fAClient.findMany({
        where: { advisorId },
        include: { holdings: true },
      }),
      this.prisma.commissionRecord.findMany({
        where: { advisorId },
        orderBy: { period: 'desc' },
        take: 12,
      }),
    ])

    // Total AUM
    const totalAum = clients.reduce(
      (sum, c) => sum + c.holdings.reduce((s, h) => s + Number(h.currentValue || 0), 0),
      0,
    )

    // AUM by ARN (placeholder — orders don't yet all have arnNumber tagged)
    const aumByArn = arns.map((a) => ({
      arnNumber: a.arnNumber,
      label: a.label || a.arnNumber,
      aum: a.isDefault ? totalAum : 0, // Default ARN gets all AUM until orders are tagged
    }))

    // Team performance
    const teamPerformance = staffMembers.map((s) => ({
      staffId: s.id,
      displayName: s.displayName,
      euin: s.euin,
      clientCount: s.assignedClients.length,
      aum: s.assignedClients.reduce(
        (sum, c) => sum + c.holdings.reduce((hs, h) => hs + Number(h.currentValue || 0), 0),
        0,
      ),
    }))

    // Commission summary
    const currentPeriod = new Date().toISOString().slice(0, 7) // "2026-02"
    const currentPeriodRecords = commissionRecords.filter((r) => r.period === currentPeriod)
    const ytdRecords = commissionRecords.filter((r) => r.period.startsWith(currentPeriod.slice(0, 4)))

    const commissionSummary = {
      currentPeriodTotal: currentPeriodRecords.reduce((s, r) => s + Number(r.actualTrail), 0),
      ytdTotal: ytdRecords.reduce((s, r) => s + Number(r.actualTrail), 0),
    }

    return {
      totalAum,
      totalClients: clients.length,
      totalTeamMembers: staffMembers.length,
      activeArns: arns.length,
      aumByArn,
      teamPerformance,
      commissionSummary,
    }
  }
}
