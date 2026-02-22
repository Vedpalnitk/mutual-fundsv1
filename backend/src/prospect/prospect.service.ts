import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AuditLogService } from '../common/services/audit-log.service'
import { Prisma } from '@prisma/client'
import {
  CreateProspectDto, UpdateProspectDto, ProspectFilterDto,
  ConvertProspectDto, CreateMeetingNoteDto,
} from './dto'

@Injectable()
export class ProspectService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditLogService,
  ) {}

  private mapProspect(p: any) {
    return {
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      potentialAum: Number(p.potentialAum),
      stage: p.stage,
      source: p.source,
      notes: p.notes,
      referredBy: p.referredBy,
      nextAction: p.nextAction,
      nextActionDate: p.nextActionDate?.toISOString().split('T')[0] || null,
      convertedClientId: p.convertedClientId,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      meetingNotes: p.meetingNotes?.map((n: any) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        meetingType: n.meetingType,
        meetingDate: n.meetingDate?.toISOString().split('T')[0] || null,
        createdAt: n.createdAt.toISOString(),
      })) || [],
    }
  }

  async list(advisorId: string, filters: ProspectFilterDto) {
    const where: Prisma.ProspectWhereInput = { advisorId }
    if (filters.stage) where.stage = filters.stage as any
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const prospects = await this.prisma.prospect.findMany({
      where,
      include: { meetingNotes: { orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    })

    return prospects.map(p => this.mapProspect(p))
  }

  async getStats(advisorId: string) {
    const prospects = await this.prisma.prospect.findMany({
      where: { advisorId },
      select: { stage: true, potentialAum: true },
    })

    const stages = ['DISCOVERY', 'ANALYSIS', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']
    const byStage: Record<string, number> = {}
    for (const s of stages) {
      byStage[s] = prospects.filter(p => p.stage === s).length
    }

    const active = prospects.filter(p => !['CLOSED_WON', 'CLOSED_LOST'].includes(p.stage))
    const won = prospects.filter(p => p.stage === 'CLOSED_WON')
    const lost = prospects.filter(p => p.stage === 'CLOSED_LOST')
    const totalClosed = won.length + lost.length

    return {
      total: prospects.length,
      byStage,
      activeCount: active.length,
      pipelineValue: active.reduce((sum, p) => sum + Number(p.potentialAum), 0),
      wonCount: won.length,
      wonValue: won.reduce((sum, p) => sum + Number(p.potentialAum), 0),
      conversionRate: totalClosed > 0 ? Math.round((won.length / totalClosed) * 100) : 0,
    }
  }

  async getById(id: string, advisorId: string) {
    const prospect = await this.prisma.prospect.findFirst({
      where: { id, advisorId },
      include: { meetingNotes: { orderBy: { createdAt: 'desc' } } },
    })
    if (!prospect) throw new NotFoundException('Prospect not found')
    return this.mapProspect(prospect)
  }

  async create(advisorId: string, userId: string, dto: CreateProspectDto) {
    const prospect = await this.prisma.prospect.create({
      data: {
        advisorId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        potentialAum: dto.potentialAum || 0,
        source: (dto.source as any) || 'OTHER',
        notes: dto.notes,
        referredBy: dto.referredBy,
        nextAction: dto.nextAction,
        nextActionDate: dto.nextActionDate ? new Date(dto.nextActionDate) : null,
      },
      include: { meetingNotes: true },
    })

    await this.prisma.cRMActivityLog.create({
      data: {
        advisorId,
        type: 'NOTE',
        summary: `Prospect added: ${dto.name}`,
      },
    })

    await this.audit.log({
      userId,
      action: 'CREATE',
      entityType: 'Prospect',
      entityId: prospect.id,
      newValue: { name: dto.name, source: dto.source },
    })

    return this.mapProspect(prospect)
  }

  async update(id: string, advisorId: string, userId: string, dto: UpdateProspectDto) {
    const existing = await this.prisma.prospect.findFirst({ where: { id, advisorId } })
    if (!existing) throw new NotFoundException('Prospect not found')

    const data: any = {}
    if (dto.name !== undefined) data.name = dto.name
    if (dto.email !== undefined) data.email = dto.email
    if (dto.phone !== undefined) data.phone = dto.phone
    if (dto.potentialAum !== undefined) data.potentialAum = dto.potentialAum
    if (dto.stage !== undefined) data.stage = dto.stage
    if (dto.source !== undefined) data.source = dto.source
    if (dto.notes !== undefined) data.notes = dto.notes
    if (dto.referredBy !== undefined) data.referredBy = dto.referredBy
    if (dto.nextAction !== undefined) data.nextAction = dto.nextAction
    if (dto.nextActionDate !== undefined) data.nextActionDate = new Date(dto.nextActionDate)

    const prospect = await this.prisma.prospect.update({
      where: { id },
      data,
      include: { meetingNotes: { orderBy: { createdAt: 'desc' } } },
    })

    // Log stage change
    if (dto.stage && dto.stage !== existing.stage) {
      await this.prisma.cRMActivityLog.create({
        data: {
          advisorId,
          type: 'NOTE',
          summary: `Prospect "${existing.name}" moved from ${existing.stage} to ${dto.stage}`,
        },
      })
    }

    await this.audit.log({
      userId,
      action: 'UPDATE',
      entityType: 'Prospect',
      entityId: id,
      oldValue: { stage: existing.stage },
      newValue: data,
    })

    return this.mapProspect(prospect)
  }

  async remove(id: string, advisorId: string, userId: string) {
    const existing = await this.prisma.prospect.findFirst({ where: { id, advisorId } })
    if (!existing) throw new NotFoundException('Prospect not found')

    await this.prisma.prospect.delete({ where: { id } })

    await this.audit.log({
      userId,
      action: 'DELETE',
      entityType: 'Prospect',
      entityId: id,
      oldValue: { name: existing.name },
    })

    return { id, deleted: true }
  }

  async convert(id: string, advisorId: string, userId: string, dto: ConvertProspectDto) {
    const prospect = await this.prisma.prospect.findFirst({ where: { id, advisorId } })
    if (!prospect) throw new NotFoundException('Prospect not found')

    // Create FAClient from prospect data + KYC details
    const riskProfileMap: Record<string, string> = {
      CONSERVATIVE: 'CONSERVATIVE',
      MODERATE: 'MODERATE',
      AGGRESSIVE: 'AGGRESSIVE',
    }

    const client = await this.prisma.fAClient.create({
      data: {
        advisorId,
        name: prospect.name,
        email: prospect.email,
        phone: prospect.phone,
        pan: dto.pan.toUpperCase(),
        dateOfBirth: new Date(dto.dateOfBirth),
        riskProfile: (riskProfileMap[dto.riskProfile || 'MODERATE'] || 'MODERATE') as any,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,
        status: 'PENDING_KYC' as any,
        kycStatus: 'PENDING' as any,
      },
    })

    // Mark prospect as converted
    await this.prisma.prospect.update({
      where: { id },
      data: {
        stage: 'CLOSED_WON',
        convertedClientId: client.id,
      },
    })

    // Log CRM activity
    await this.prisma.cRMActivityLog.create({
      data: {
        advisorId,
        clientId: client.id,
        type: 'NOTE',
        summary: `Prospect "${prospect.name}" converted to client`,
      },
    })

    await this.audit.log({
      userId,
      action: 'CREATE',
      entityType: 'FAClient',
      entityId: client.id,
      newValue: { name: client.name, source: 'prospect_conversion', prospectId: id },
    })

    return { clientId: client.id }
  }

  async addMeetingNote(id: string, advisorId: string, dto: CreateMeetingNoteDto) {
    const prospect = await this.prisma.prospect.findFirst({ where: { id, advisorId } })
    if (!prospect) throw new NotFoundException('Prospect not found')

    const note = await this.prisma.prospectMeetingNote.create({
      data: {
        prospectId: id,
        title: dto.title,
        content: dto.content,
        meetingType: dto.meetingType || 'CALL',
        meetingDate: new Date(dto.meetingDate),
      },
    })

    return {
      id: note.id,
      title: note.title,
      content: note.content,
      meetingType: note.meetingType,
      meetingDate: note.meetingDate.toISOString().split('T')[0],
      createdAt: note.createdAt.toISOString(),
    }
  }
}
