import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AuditLogService } from '../common/services/audit-log.service'
import { CreateBranchDto, UpdateBranchDto } from './dto'

@Injectable()
export class BranchesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditLogService,
  ) {}

  async findAll(advisorId: string) {
    const branches = await this.prisma.branch.findMany({
      where: { advisorId },
      include: {
        staff: {
          where: { isActive: true },
          select: { id: true, displayName: true, staffRole: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return branches.map((b) => ({
      id: b.id,
      name: b.name,
      city: b.city,
      code: b.code,
      isActive: b.isActive,
      staffCount: b.staff.length,
      staff: b.staff,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    }))
  }

  async findOne(id: string, advisorId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id, advisorId },
      include: {
        staff: {
          include: {
            staffUser: {
              select: { email: true, phone: true },
            },
          },
        },
      },
    })

    if (!branch) throw new NotFoundException('Branch not found')

    return {
      id: branch.id,
      name: branch.name,
      city: branch.city,
      code: branch.code,
      isActive: branch.isActive,
      staffCount: branch.staff.length,
      staff: branch.staff.map((s) => ({
        id: s.id,
        displayName: s.displayName,
        staffRole: s.staffRole,
        email: s.staffUser.email,
        phone: s.staffUser.phone,
        isActive: s.isActive,
      })),
      createdAt: branch.createdAt,
      updatedAt: branch.updatedAt,
    }
  }

  async create(advisorId: string, userId: string, dto: CreateBranchDto) {
    if (dto.code) {
      const existing = await this.prisma.branch.findUnique({
        where: { advisorId_code: { advisorId, code: dto.code } },
      })
      if (existing) throw new ConflictException('Branch code already exists')
    }

    const branch = await this.prisma.branch.create({
      data: {
        advisorId,
        name: dto.name,
        city: dto.city,
        code: dto.code,
      },
    })

    await this.audit.log({
      userId,
      action: 'CREATE',
      entityType: 'Branch',
      entityId: branch.id,
      newValue: { name: dto.name, city: dto.city, code: dto.code },
    })

    return { ...branch, staffCount: 0, staff: [] }
  }

  async update(id: string, advisorId: string, userId: string, dto: UpdateBranchDto) {
    const branch = await this.prisma.branch.findFirst({
      where: { id, advisorId },
    })
    if (!branch) throw new NotFoundException('Branch not found')

    const updateData: any = {}
    if (dto.name !== undefined) updateData.name = dto.name
    if (dto.city !== undefined) updateData.city = dto.city
    if (dto.code !== undefined) updateData.code = dto.code
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive

    const updated = await this.prisma.branch.update({
      where: { id },
      data: updateData,
    })

    await this.audit.log({
      userId,
      action: 'UPDATE',
      entityType: 'Branch',
      entityId: id,
      oldValue: { name: branch.name, city: branch.city, code: branch.code, isActive: branch.isActive },
      newValue: updateData,
    })

    return updated
  }

  async remove(id: string, advisorId: string, userId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id, advisorId },
      include: { staff: { where: { isActive: true } } },
    })
    if (!branch) throw new NotFoundException('Branch not found')

    if (branch.staff.length > 0) {
      throw new ConflictException('Cannot delete branch with active staff. Reassign staff first.')
    }

    await this.prisma.branch.delete({ where: { id } })

    await this.audit.log({
      userId,
      action: 'DELETE',
      entityType: 'Branch',
      entityId: id,
      oldValue: { name: branch.name, city: branch.city, code: branch.code },
    })

    return { success: true }
  }
}
