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
      },
      orderBy: { createdAt: 'desc' },
    });

    return staffMembers.map((s) => ({
      id: s.id,
      displayName: s.displayName,
      email: s.staffUser.email,
      phone: s.staffUser.phone,
      allowedPages: s.allowedPages,
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
      },
    });

    if (!staff) throw new NotFoundException('Staff member not found');

    return {
      id: staff.id,
      displayName: staff.displayName,
      email: staff.staffUser.email,
      phone: staff.staffUser.phone,
      allowedPages: staff.allowedPages,
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
        },
      });

      return {
        id: staffMember.id,
        displayName: staffMember.displayName,
        email: user.email,
        phone: user.phone,
        allowedPages: staffMember.allowedPages,
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
      },
    });

    return {
      id: updated.id,
      displayName: updated.displayName,
      email: updated.staffUser.email,
      phone: updated.staffUser.phone,
      allowedPages: updated.allowedPages,
      isActive: updated.isActive,
      lastLoginAt: updated.staffUser.lastLoginAt,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async deactivate(id: string, ownerId: string) {
    return this.update(id, ownerId, { isActive: false });
  }
}
