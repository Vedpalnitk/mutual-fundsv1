import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { AuditLogService } from '../../common/services/audit-log.service'

@Injectable()
export class AdminSettingsService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async findAll() {
    return this.prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    })
  }

  async findOne(key: string) {
    const setting = await this.prisma.systemSetting.findUnique({ where: { key } })
    if (!setting) throw new NotFoundException(`Setting "${key}" not found`)
    return setting
  }

  async upsert(key: string, value: any, userId: string) {
    const existing = await this.prisma.systemSetting.findUnique({ where: { key } })

    const setting = await this.prisma.systemSetting.upsert({
      where: { key },
      create: { key, value, updatedBy: userId },
      update: { value, updatedBy: userId },
    })

    await this.auditLog.log({
      userId,
      action: existing ? 'UPDATE' : 'CREATE',
      entityType: 'SystemSetting',
      entityId: key,
      details: { oldValue: existing?.value, newValue: value },
    })

    return setting
  }
}
