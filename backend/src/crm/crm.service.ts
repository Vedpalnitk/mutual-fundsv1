import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AuditLogService } from '../common/services/audit-log.service'
import { Prisma } from '@prisma/client'
import {
  CreateTaskDto, UpdateTaskDto, TaskFilterDto,
  CreateActivityDto, ActivityFilterDto,
} from './dto'

@Injectable()
export class CRMService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditLogService,
  ) {}

  // ============= TASKS =============

  async listTasks(advisorId: string, filters: TaskFilterDto) {
    const where: Prisma.CRMTaskWhereInput = { advisorId }
    if (filters.status) where.status = filters.status as any
    if (filters.priority) where.priority = filters.priority as any
    if (filters.category) where.category = filters.category as any
    if (filters.assignedToId) where.assignedToId = filters.assignedToId
    if (filters.clientId) where.clientId = filters.clientId

    const tasks = await this.prisma.cRMTask.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, displayName: true } },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    })

    return tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      clientId: t.clientId,
      clientName: t.client?.name || null,
      assignedToId: t.assignedToId,
      assignedToName: t.assignedTo?.displayName || null,
      dueDate: t.dueDate?.toISOString().split('T')[0] || null,
      priority: t.priority,
      status: t.status,
      category: t.category,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }))
  }

  async createTask(advisorId: string, userId: string, dto: CreateTaskDto) {
    const task = await this.prisma.cRMTask.create({
      data: {
        advisorId,
        title: dto.title,
        description: dto.description,
        clientId: dto.clientId || null,
        assignedToId: dto.assignedToId || null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        priority: (dto.priority as any) || 'MEDIUM',
        category: (dto.category as any) || 'GENERAL',
      },
      include: {
        client: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, displayName: true } },
      },
    })

    // Log activity
    await this.prisma.cRMActivityLog.create({
      data: {
        advisorId,
        clientId: dto.clientId || null,
        type: 'TASK_CREATED',
        summary: `Task created: ${dto.title}`,
      },
    })

    await this.audit.log({
      userId,
      action: 'CREATE',
      entityType: 'CRMTask',
      entityId: task.id,
      newValue: { title: dto.title, category: dto.category },
    })

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      clientId: task.clientId,
      clientName: task.client?.name || null,
      assignedToId: task.assignedToId,
      assignedToName: task.assignedTo?.displayName || null,
      dueDate: task.dueDate?.toISOString().split('T')[0] || null,
      priority: task.priority,
      status: task.status,
      category: task.category,
      createdAt: task.createdAt.toISOString(),
    }
  }

  async updateTask(id: string, advisorId: string, userId: string, dto: UpdateTaskDto) {
    const existing = await this.prisma.cRMTask.findFirst({ where: { id, advisorId } })
    if (!existing) throw new NotFoundException('Task not found')

    const data: any = {}
    if (dto.title !== undefined) data.title = dto.title
    if (dto.description !== undefined) data.description = dto.description
    if (dto.clientId !== undefined) data.clientId = dto.clientId
    if (dto.assignedToId !== undefined) data.assignedToId = dto.assignedToId
    if (dto.dueDate !== undefined) data.dueDate = new Date(dto.dueDate)
    if (dto.priority !== undefined) data.priority = dto.priority
    if (dto.status !== undefined) data.status = dto.status
    if (dto.category !== undefined) data.category = dto.category

    const task = await this.prisma.cRMTask.update({
      where: { id },
      data,
      include: {
        client: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, displayName: true } },
      },
    })

    await this.audit.log({
      userId,
      action: 'UPDATE',
      entityType: 'CRMTask',
      entityId: id,
      oldValue: { status: existing.status, priority: existing.priority },
      newValue: data,
    })

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      clientId: task.clientId,
      clientName: task.client?.name || null,
      assignedToId: task.assignedToId,
      assignedToName: task.assignedTo?.displayName || null,
      dueDate: task.dueDate?.toISOString().split('T')[0] || null,
      priority: task.priority,
      status: task.status,
      category: task.category,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }
  }

  async completeTask(id: string, advisorId: string, userId: string) {
    const task = await this.prisma.cRMTask.findFirst({ where: { id, advisorId } })
    if (!task) throw new NotFoundException('Task not found')

    const updated = await this.prisma.cRMTask.update({
      where: { id },
      data: { status: 'COMPLETED' },
    })

    await this.prisma.cRMActivityLog.create({
      data: {
        advisorId,
        clientId: task.clientId,
        type: 'TASK_COMPLETED',
        summary: `Task completed: ${task.title}`,
      },
    })

    return { id: updated.id, status: updated.status }
  }

  async getOverdueTasks(advisorId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return this.listTasks(advisorId, { status: undefined } as any).then(
      (tasks) => tasks.filter((t) =>
        t.dueDate && new Date(t.dueDate) < today &&
        t.status !== 'COMPLETED' && t.status !== 'CANCELLED'
      )
    )
  }

  async getTaskSummary(advisorId: string) {
    const [total, open, inProgress, overdue, completedThisMonth] = await Promise.all([
      this.prisma.cRMTask.count({ where: { advisorId } }),
      this.prisma.cRMTask.count({ where: { advisorId, status: 'OPEN' } }),
      this.prisma.cRMTask.count({ where: { advisorId, status: 'IN_PROGRESS' } }),
      this.prisma.cRMTask.count({
        where: {
          advisorId,
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          dueDate: { lt: new Date() },
        },
      }),
      this.prisma.cRMTask.count({
        where: {
          advisorId,
          status: 'COMPLETED',
          updatedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
    ])

    return { total, open, inProgress, overdue, completedThisMonth }
  }

  // ============= ACTIVITIES =============

  async listActivities(advisorId: string, filters: ActivityFilterDto) {
    const where: Prisma.CRMActivityLogWhereInput = { advisorId }
    if (filters.clientId) where.clientId = filters.clientId
    if (filters.staffId) where.staffId = filters.staffId
    if (filters.type) where.type = filters.type as any
    if (filters.from || filters.to) {
      where.createdAt = {}
      if (filters.from) (where.createdAt as any).gte = new Date(filters.from)
      if (filters.to) (where.createdAt as any).lte = new Date(filters.to)
    }

    const activities = await this.prisma.cRMActivityLog.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        staff: { select: { id: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return activities.map((a) => ({
      id: a.id,
      type: a.type,
      summary: a.summary,
      details: a.details,
      clientId: a.clientId,
      clientName: a.client?.name || null,
      staffId: a.staffId,
      staffName: a.staff?.displayName || null,
      createdAt: a.createdAt.toISOString(),
    }))
  }

  async createActivity(advisorId: string, userId: string, dto: CreateActivityDto, staffId?: string) {
    const activity = await this.prisma.cRMActivityLog.create({
      data: {
        advisorId,
        clientId: dto.clientId || null,
        staffId: staffId || null,
        type: dto.type as any,
        summary: dto.summary,
        details: dto.details,
      },
      include: {
        client: { select: { id: true, name: true } },
        staff: { select: { id: true, displayName: true } },
      },
    })

    return {
      id: activity.id,
      type: activity.type,
      summary: activity.summary,
      details: activity.details,
      clientId: activity.clientId,
      clientName: activity.client?.name || null,
      staffId: activity.staffId,
      staffName: activity.staff?.displayName || null,
      createdAt: activity.createdAt.toISOString(),
    }
  }
}
