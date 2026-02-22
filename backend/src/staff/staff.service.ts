import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateStaffDto, UpdateStaffDto } from './dto';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async findAll(ownerId: string) {
    const staffMembers = await this.prisma.fAStaffMember.findMany({
      where: { ownerId },
      include: {
        staffUser: {
          select: {
            id: true,
            email: true,
            phone: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        branch: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return staffMembers.map((s) => ({
      id: s.id,
      displayName: s.displayName,
      email: s.staffUser.email,
      phone: s.staffUser.phone,
      allowedPages: s.allowedPages,
      staffRole: s.staffRole,
      euin: s.euin,
      euinExpiry: s.euinExpiry?.toISOString().split('T')[0] || null,
      branchId: s.branchId,
      branch: s.branch,
      isActive: s.isActive,
      lastLoginAt: s.staffUser.lastLoginAt,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  }

  async findOne(id: string, ownerId: string) {
    const staff = await this.prisma.fAStaffMember.findFirst({
      where: { id, ownerId },
      include: {
        staffUser: {
          select: {
            id: true,
            email: true,
            phone: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        branch: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!staff) throw new NotFoundException('Staff member not found');

    return {
      id: staff.id,
      displayName: staff.displayName,
      email: staff.staffUser.email,
      phone: staff.staffUser.phone,
      allowedPages: staff.allowedPages,
      staffRole: staff.staffRole,
      euin: staff.euin,
      euinExpiry: staff.euinExpiry?.toISOString().split('T')[0] || null,
      branchId: staff.branchId,
      branch: staff.branch,
      isActive: staff.isActive,
      lastLoginAt: staff.staffUser.lastLoginAt,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
    };
  }

  async create(ownerId: string, dto: CreateStaffDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user + staff member in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create the user with role fa_staff
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash: hashedPassword,
          phone: dto.phone || null,
          role: 'fa_staff',
          isActive: true,
          isVerified: true,
          profile: {
            create: { name: dto.displayName },
          },
        },
      });

      // Create the staff member link
      const staffMember = await tx.fAStaffMember.create({
        data: {
          ownerId,
          staffUserId: user.id,
          displayName: dto.displayName,
          allowedPages: dto.allowedPages,
          staffRole: dto.staffRole || 'RM',
          euin: dto.euin,
          euinExpiry: dto.euinExpiry ? new Date(dto.euinExpiry) : null,
          branchId: dto.branchId || null,
        },
      });

      return {
        id: staffMember.id,
        displayName: staffMember.displayName,
        email: user.email,
        phone: user.phone,
        allowedPages: staffMember.allowedPages,
        staffRole: staffMember.staffRole,
        euin: staffMember.euin,
        euinExpiry: staffMember.euinExpiry?.toISOString().split('T')[0] || null,
        branchId: staffMember.branchId,
        isActive: staffMember.isActive,
        createdAt: staffMember.createdAt,
      };
    });

    return result;
  }

  async update(id: string, ownerId: string, dto: UpdateStaffDto) {
    const staff = await this.prisma.fAStaffMember.findFirst({
      where: { id, ownerId },
    });
    if (!staff) throw new NotFoundException('Staff member not found');

    const updateData: any = {};
    if (dto.displayName !== undefined) updateData.displayName = dto.displayName;
    if (dto.allowedPages !== undefined) updateData.allowedPages = dto.allowedPages;
    if (dto.staffRole !== undefined) updateData.staffRole = dto.staffRole;
    if (dto.euin !== undefined) updateData.euin = dto.euin;
    if (dto.euinExpiry !== undefined) updateData.euinExpiry = new Date(dto.euinExpiry);
    if (dto.branchId !== undefined) updateData.branchId = dto.branchId || null;
    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
      // Also toggle user active status
      await this.prisma.user.update({
        where: { id: staff.staffUserId },
        data: { isActive: dto.isActive },
      });
    }

    const updated = await this.prisma.fAStaffMember.update({
      where: { id },
      data: updateData,
      include: {
        staffUser: {
          select: { email: true, phone: true, lastLoginAt: true },
        },
        branch: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return {
      id: updated.id,
      displayName: updated.displayName,
      email: updated.staffUser.email,
      phone: updated.staffUser.phone,
      allowedPages: updated.allowedPages,
      staffRole: updated.staffRole,
      euin: updated.euin,
      euinExpiry: updated.euinExpiry?.toISOString().split('T')[0] || null,
      branchId: updated.branchId,
      branch: updated.branch,
      isActive: updated.isActive,
      lastLoginAt: updated.staffUser.lastLoginAt,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async deactivate(id: string, ownerId: string) {
    return this.update(id, ownerId, { isActive: false });
  }

  async getEuinExpiry(ownerId: string, daysAhead = 90) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + daysAhead);

    const staff = await this.prisma.fAStaffMember.findMany({
      where: {
        ownerId,
        isActive: true,
        euinExpiry: { lte: cutoff },
      },
      include: {
        staffUser: { select: { email: true } },
        branch: { select: { name: true } },
      },
      orderBy: { euinExpiry: 'asc' },
    });

    return staff.map((s) => ({
      id: s.id,
      displayName: s.displayName,
      email: s.staffUser.email,
      euin: s.euin,
      euinExpiry: s.euinExpiry?.toISOString().split('T')[0] || null,
      branchName: s.branch?.name || null,
      daysUntilExpiry: s.euinExpiry
        ? Math.ceil((s.euinExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null,
    }));
  }

  async getStaffClients(staffId: string, ownerId: string) {
    const staff = await this.prisma.fAStaffMember.findFirst({
      where: { id: staffId, ownerId },
    });
    if (!staff) throw new NotFoundException('Staff member not found');

    const clients = await this.prisma.fAClient.findMany({
      where: { advisorId: ownerId, assignedRmId: staffId },
      include: {
        holdings: true,
        sips: { where: { status: 'ACTIVE' } },
      },
    });

    return clients.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      aum: c.holdings.reduce((sum, h) => sum + Number(h.currentValue || 0), 0),
      sipCount: c.sips.length,
      status: c.status,
    }));
  }

  async reassignClients(staffId: string, ownerId: string, targetStaffId: string, userId: string) {
    const [sourceStaff, targetStaff] = await Promise.all([
      this.prisma.fAStaffMember.findFirst({ where: { id: staffId, ownerId } }),
      this.prisma.fAStaffMember.findFirst({ where: { id: targetStaffId, ownerId } }),
    ]);
    if (!sourceStaff) throw new NotFoundException('Source staff not found');
    if (!targetStaff) throw new NotFoundException('Target staff not found');

    const result = await this.prisma.fAClient.updateMany({
      where: { advisorId: ownerId, assignedRmId: staffId },
      data: { assignedRmId: targetStaffId },
    });

    return { reassignedCount: result.count, fromStaff: sourceStaff.displayName, toStaff: targetStaff.displayName };
  }

  async getPerformance(staffId: string, ownerId: string) {
    const staff = await this.prisma.fAStaffMember.findFirst({
      where: { id: staffId, ownerId },
    });
    if (!staff) throw new NotFoundException('Staff member not found');

    const [clients, transactions, commissionPayouts] = await Promise.all([
      this.prisma.fAClient.findMany({
        where: { advisorId: ownerId, assignedRmId: staffId },
        include: { holdings: true },
      }),
      this.prisma.fATransaction.findMany({
        where: {
          client: { advisorId: ownerId, assignedRmId: staffId },
          date: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) },
        },
      }),
      this.prisma.euinCommissionPayout.findMany({
        where: { staffMemberId: staffId, advisorId: ownerId },
      }),
    ]);

    const aum = clients.reduce(
      (sum, c) => sum + c.holdings.reduce((s, h) => s + Number(h.currentValue || 0), 0),
      0,
    );

    const commissionEarned = commissionPayouts
      .filter((p) => p.status === 'PAID')
      .reduce((s, p) => s + Number(p.payoutAmount), 0);

    return {
      staffId,
      displayName: staff.displayName,
      euin: staff.euin,
      clientCount: clients.length,
      aum,
      transactionCount30d: transactions.length,
      commissionEarned,
    };
  }

  async assignBranch(staffId: string, ownerId: string, branchId: string) {
    const staff = await this.prisma.fAStaffMember.findFirst({ where: { id: staffId, ownerId } });
    if (!staff) throw new NotFoundException('Staff member not found');

    const updated = await this.prisma.fAStaffMember.update({
      where: { id: staffId },
      data: { branchId: branchId || null },
      include: { branch: { select: { id: true, name: true, code: true } } },
    });

    return { id: updated.id, branchId: updated.branchId, branch: updated.branch };
  }
}
