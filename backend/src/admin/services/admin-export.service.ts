import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { ExportQueryDto } from '../dto/export-query.dto'

const MAX_EXPORT_ROWS = 10000

@Injectable()
export class AdminExportService {
  constructor(private prisma: PrismaService) {}

  async exportUsers(query: ExportQueryDto) {
    const where: any = { deletedAt: null }
    if (query.role) where.role = query.role
    if (query.status === 'active') where.isActive = true
    if (query.status === 'inactive') where.isActive = false
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { profile: { name: { contains: query.search, mode: 'insensitive' } } },
      ]
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        lastLoginAt: true,
        createdAt: true,
        profile: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_EXPORT_ROWS,
    })

    return this.toCsv(
      ['ID', 'Name', 'Email', 'Phone', 'Role', 'Active', 'Verified', 'Last Login', 'Created'],
      users.map(u => [
        u.id, u.profile?.name || '', u.email, u.phone || '', u.role,
        u.isActive ? 'Yes' : 'No', u.isVerified ? 'Yes' : 'No',
        u.lastLoginAt?.toISOString() || '', u.createdAt.toISOString(),
      ]),
    )
  }

  async exportAuditLogs(query: ExportQueryDto) {
    const where: any = {}
    if (query.from) where.createdAt = { ...where.createdAt, gte: new Date(query.from) }
    if (query.to) where.createdAt = { ...where.createdAt, lte: new Date(query.to) }

    const logs = await this.prisma.auditLog.findMany({
      where,
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
      take: MAX_EXPORT_ROWS,
    })

    return this.toCsv(
      ['ID', 'Timestamp', 'User Email', 'Action', 'Entity Type', 'Entity ID', 'IP Address'],
      logs.map(l => [
        l.id, l.createdAt.toISOString(), l.user.email, l.action,
        l.entityType, l.entityId || '', l.ipAddress || '',
      ]),
    )
  }

  async exportTransactions(query: ExportQueryDto) {
    const where: any = { deletedAt: null }
    if (query.status) where.status = query.status
    if (query.from) where.createdAt = { ...where.createdAt, gte: new Date(query.from) }
    if (query.to) where.createdAt = { ...where.createdAt, lte: new Date(query.to) }

    const txns = await this.prisma.fATransaction.findMany({
      where,
      include: { client: { select: { name: true, advisorId: true } } },
      orderBy: { createdAt: 'desc' },
      take: MAX_EXPORT_ROWS,
    })

    return this.toCsv(
      ['ID', 'Date', 'Type', 'Fund', 'Client', 'Amount', 'Units', 'NAV', 'Status', 'Folio'],
      txns.map(t => [
        t.id, t.date.toISOString().split('T')[0], t.type, t.fundName,
        t.client.name, Number(t.amount).toFixed(2), Number(t.units).toFixed(4),
        Number(t.nav).toFixed(4), t.status, t.folioNumber,
      ]),
    )
  }

  async exportAdvisors() {
    const advisors = await this.prisma.user.findMany({
      where: { role: { in: ['advisor', 'fa_staff'] }, deletedAt: null },
      select: {
        id: true,
        email: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        profile: { select: { name: true } },
        advisorClients: {
          where: { deletedAt: null },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_EXPORT_ROWS,
    })

    return this.toCsv(
      ['ID', 'Name', 'Email', 'Active', 'Clients', 'Last Login', 'Created'],
      advisors.map(a => [
        a.id, a.profile?.name || '', a.email,
        a.isActive ? 'Yes' : 'No', a.advisorClients.length.toString(),
        a.lastLoginAt?.toISOString() || '', a.createdAt.toISOString(),
      ]),
    )
  }

  private toCsv(headers: string[], rows: string[][]): string {
    const escape = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val
    }
    const lines = [headers.map(escape).join(',')]
    for (const row of rows) {
      lines.push(row.map(escape).join(','))
    }
    return lines.join('\n')
  }
}
