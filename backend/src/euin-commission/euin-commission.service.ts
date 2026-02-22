import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateSplitDto, UpdateSplitDto, ComputePayoutsDto } from './dto'
import { Decimal } from '@prisma/client/runtime/library'

@Injectable()
export class EuinCommissionService {
  constructor(private prisma: PrismaService) {}

  // ─── Splits CRUD ───

  async listSplits(advisorId: string) {
    const splits = await this.prisma.euinCommissionSplit.findMany({
      where: { advisorId },
      include: {
        staffMember: {
          select: { id: true, displayName: true, euin: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return splits.map((s) => ({
      id: s.id,
      staffMemberId: s.staffMemberId,
      staffName: s.staffMember.displayName,
      euin: s.staffMember.euin,
      splitPercent: Number(s.splitPercent),
      effectiveFrom: s.effectiveFrom.toISOString().split('T')[0],
      effectiveTo: s.effectiveTo?.toISOString().split('T')[0] || null,
    }))
  }

  async createSplit(advisorId: string, dto: CreateSplitDto) {
    // Verify staff belongs to this advisor
    const staff = await this.prisma.fAStaffMember.findFirst({
      where: { id: dto.staffMemberId, ownerId: advisorId },
    })
    if (!staff) throw new NotFoundException('Staff member not found')
    if (!staff.euin) throw new BadRequestException('Staff member does not have an EUIN assigned')

    // Check total splits don't exceed 100%
    const existingSplits = await this.prisma.euinCommissionSplit.findMany({
      where: {
        advisorId,
        effectiveTo: null, // Only active (non-expired) splits
      },
    })
    const totalExisting = existingSplits
      .filter((s) => s.staffMemberId !== dto.staffMemberId)
      .reduce((sum, s) => sum + Number(s.splitPercent), 0)
    if (totalExisting + dto.splitPercent > 100) {
      throw new BadRequestException(
        `Total splits would be ${totalExisting + dto.splitPercent}%. Maximum is 100%.`,
      )
    }

    return this.prisma.euinCommissionSplit.create({
      data: {
        advisorId,
        staffMemberId: dto.staffMemberId,
        splitPercent: dto.splitPercent,
        effectiveFrom: new Date(dto.effectiveFrom),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
      },
      include: {
        staffMember: {
          select: { displayName: true, euin: true },
        },
      },
    })
  }

  async updateSplit(id: string, advisorId: string, dto: UpdateSplitDto) {
    const split = await this.prisma.euinCommissionSplit.findFirst({
      where: { id, advisorId },
    })
    if (!split) throw new NotFoundException('Commission split not found')

    // Validate total if changing percent
    if (dto.splitPercent !== undefined) {
      const existingSplits = await this.prisma.euinCommissionSplit.findMany({
        where: { advisorId, effectiveTo: null },
      })
      const totalOthers = existingSplits
        .filter((s) => s.id !== id)
        .reduce((sum, s) => sum + Number(s.splitPercent), 0)
      if (totalOthers + dto.splitPercent > 100) {
        throw new BadRequestException(
          `Total splits would be ${totalOthers + dto.splitPercent}%. Maximum is 100%.`,
        )
      }
    }

    return this.prisma.euinCommissionSplit.update({
      where: { id },
      data: {
        ...(dto.splitPercent !== undefined && { splitPercent: dto.splitPercent }),
        ...(dto.effectiveFrom !== undefined && { effectiveFrom: new Date(dto.effectiveFrom) }),
        ...(dto.effectiveTo !== undefined && {
          effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
        }),
      },
    })
  }

  async deleteSplit(id: string, advisorId: string) {
    const split = await this.prisma.euinCommissionSplit.findFirst({
      where: { id, advisorId },
    })
    if (!split) throw new NotFoundException('Commission split not found')

    await this.prisma.euinCommissionSplit.delete({ where: { id } })
    return { deleted: true }
  }

  // ─── Payout Computation ───

  async computePayouts(advisorId: string, dto: ComputePayoutsDto) {
    const { period } = dto

    // Get commission records for this period
    const records = await this.prisma.commissionRecord.findMany({
      where: { advisorId, period },
    })

    if (records.length === 0) {
      return { computed: 0, message: 'No commission records found for this period' }
    }

    // Get active splits
    const periodDate = new Date(period + '-01')
    const splits = await this.prisma.euinCommissionSplit.findMany({
      where: {
        advisorId,
        effectiveFrom: { lte: periodDate },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: periodDate } }],
      },
      include: {
        staffMember: { select: { id: true, euin: true, displayName: true } },
      },
    })

    if (splits.length === 0) {
      return { computed: 0, message: 'No active commission splits configured' }
    }

    // Calculate total commission for the period
    const totalCommission = records.reduce((s, r) => s + Number(r.actualTrail), 0)

    // For each split, compute the payout
    let computed = 0
    for (const split of splits) {
      if (!split.staffMember.euin) continue

      const payoutAmount = totalCommission * (Number(split.splitPercent) / 100)

      await this.prisma.euinCommissionPayout.upsert({
        where: {
          advisorId_staffMemberId_period: {
            advisorId,
            staffMemberId: split.staffMemberId,
            period,
          },
        },
        create: {
          advisorId,
          staffMemberId: split.staffMemberId,
          euin: split.staffMember.euin,
          period,
          grossCommission: new Decimal(totalCommission.toFixed(2)),
          splitPercent: split.splitPercent,
          payoutAmount: new Decimal(payoutAmount.toFixed(2)),
          status: 'PENDING',
        },
        update: {
          grossCommission: new Decimal(totalCommission.toFixed(2)),
          splitPercent: split.splitPercent,
          payoutAmount: new Decimal(payoutAmount.toFixed(2)),
          euin: split.staffMember.euin,
        },
      })
      computed++
    }

    return { computed }
  }

  // ─── Payouts List ───

  async listPayouts(advisorId: string, filters?: { period?: string; staffMemberId?: string; status?: string }) {
    const where: any = { advisorId }
    if (filters?.period) where.period = filters.period
    if (filters?.staffMemberId) where.staffMemberId = filters.staffMemberId
    if (filters?.status) where.status = filters.status

    const payouts = await this.prisma.euinCommissionPayout.findMany({
      where,
      include: {
        staffMember: {
          select: { displayName: true },
        },
      },
      orderBy: [{ period: 'desc' }, { createdAt: 'desc' }],
    })

    return payouts.map((p) => ({
      id: p.id,
      staffMemberId: p.staffMemberId,
      staffName: p.staffMember.displayName,
      euin: p.euin,
      period: p.period,
      grossCommission: Number(p.grossCommission),
      splitPercent: Number(p.splitPercent),
      payoutAmount: Number(p.payoutAmount),
      status: p.status,
      paidAt: p.paidAt?.toISOString() || null,
      createdAt: p.createdAt.toISOString(),
    }))
  }

  async approvePayout(id: string, advisorId: string) {
    const payout = await this.prisma.euinCommissionPayout.findFirst({
      where: { id, advisorId },
    })
    if (!payout) throw new NotFoundException('Payout not found')
    if (payout.status !== 'PENDING') {
      throw new BadRequestException(`Cannot approve payout with status ${payout.status}`)
    }

    return this.prisma.euinCommissionPayout.update({
      where: { id },
      data: { status: 'APPROVED' },
    })
  }

  async markPaid(id: string, advisorId: string) {
    const payout = await this.prisma.euinCommissionPayout.findFirst({
      where: { id, advisorId },
    })
    if (!payout) throw new NotFoundException('Payout not found')
    if (payout.status !== 'APPROVED') {
      throw new BadRequestException(`Cannot mark paid a payout with status ${payout.status}`)
    }

    return this.prisma.euinCommissionPayout.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date() },
    })
  }

  async disputePayout(id: string, advisorId: string) {
    const payout = await this.prisma.euinCommissionPayout.findFirst({
      where: { id, advisorId },
    })
    if (!payout) throw new NotFoundException('Payout not found')

    return this.prisma.euinCommissionPayout.update({
      where: { id },
      data: { status: 'DISPUTED' },
    })
  }

  // ─── Summary ───

  async getSummary(advisorId: string) {
    const payouts = await this.prisma.euinCommissionPayout.findMany({
      where: { advisorId },
      include: {
        staffMember: { select: { displayName: true } },
      },
    })

    const currentPeriod = new Date().toISOString().slice(0, 7)
    const currentPayouts = payouts.filter((p) => p.period === currentPeriod)

    const totalPayable = currentPayouts
      .filter((p) => p.status === 'PENDING' || p.status === 'APPROVED')
      .reduce((s, p) => s + Number(p.payoutAmount), 0)

    const totalPaid = payouts
      .filter((p) => p.status === 'PAID')
      .reduce((s, p) => s + Number(p.payoutAmount), 0)

    const pendingApproval = payouts.filter((p) => p.status === 'PENDING').length
    const disputed = payouts.filter((p) => p.status === 'DISPUTED').length

    // By EUIN breakdown
    const byEuin: Record<string, { euin: string; staffName: string; total: number }> = {}
    for (const p of payouts) {
      if (!byEuin[p.euin]) {
        byEuin[p.euin] = { euin: p.euin, staffName: p.staffMember.displayName, total: 0 }
      }
      byEuin[p.euin].total += Number(p.payoutAmount)
    }

    return {
      totalPayable,
      totalPaid,
      pendingApproval,
      disputed,
      byEuin: Object.values(byEuin),
    }
  }
}
