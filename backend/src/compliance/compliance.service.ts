import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateComplianceDto, UpdateComplianceDto, ComplianceFilterDto } from './dto';

@Injectable()
export class ComplianceService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async listRecords(advisorId: string, filters: ComplianceFilterDto) {
    const where: any = { advisorId };
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;

    const records = await this.prisma.complianceRecord.findMany({
      where,
      orderBy: { expiryDate: 'asc' },
    });

    return records.map(r => this.transformRecord(r));
  }

  async createRecord(advisorId: string, userId: string, dto: CreateComplianceDto) {
    const status = this.computeStatus(new Date(dto.expiryDate));

    const record = await this.prisma.complianceRecord.create({
      data: {
        advisorId,
        type: dto.type as any,
        entityId: dto.entityId,
        entityName: dto.entityName,
        expiryDate: new Date(dto.expiryDate),
        status: status as any,
        documentUrl: dto.documentUrl,
        notes: dto.notes,
      },
    });

    await this.audit.log({ userId, action: 'CREATE_COMPLIANCE_RECORD', entityType: 'ComplianceRecord', entityId: record.id });

    return this.transformRecord(record);
  }

  async updateRecord(id: string, advisorId: string, userId: string, dto: UpdateComplianceDto) {
    const existing = await this.prisma.complianceRecord.findFirst({
      where: { id, advisorId },
    });
    if (!existing) throw new NotFoundException('Compliance record not found');

    const data: any = {};
    if (dto.expiryDate) {
      data.expiryDate = new Date(dto.expiryDate);
      data.status = this.computeStatus(data.expiryDate);
    }
    if (dto.status) data.status = dto.status;
    if (dto.documentUrl !== undefined) data.documentUrl = dto.documentUrl;
    if (dto.notes !== undefined) data.notes = dto.notes;

    const record = await this.prisma.complianceRecord.update({
      where: { id },
      data,
    });

    await this.audit.log({ userId, action: 'UPDATE_COMPLIANCE_RECORD', entityType: 'ComplianceRecord', entityId: record.id });

    return this.transformRecord(record);
  }

  async getDashboard(advisorId: string) {
    const records = await this.prisma.complianceRecord.findMany({
      where: { advisorId },
    });

    const valid = records.filter(r => r.status === 'VALID').length;
    const expiringSoon = records.filter(r => r.status === 'EXPIRING_SOON').length;
    const expired = records.filter(r => r.status === 'EXPIRED').length;

    // Group by type
    const byType: Record<string, { valid: number; expiringSoon: number; expired: number }> = {};
    for (const r of records) {
      if (!byType[r.type]) byType[r.type] = { valid: 0, expiringSoon: 0, expired: 0 };
      if (r.status === 'VALID') byType[r.type].valid++;
      else if (r.status === 'EXPIRING_SOON') byType[r.type].expiringSoon++;
      else if (r.status === 'EXPIRED') byType[r.type].expired++;
    }

    // Upcoming expirations (next 60 days)
    const sixtyDays = new Date();
    sixtyDays.setDate(sixtyDays.getDate() + 60);
    const upcoming = records
      .filter(r => r.expiryDate <= sixtyDays && r.status !== 'EXPIRED')
      .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime())
      .slice(0, 10)
      .map(r => this.transformRecord(r));

    return {
      total: records.length,
      valid,
      expiringSoon,
      expired,
      byType,
      upcoming,
    };
  }

  async riskCheck(advisorId: string, clientId: string, schemeId?: string) {
    // Check client KYC
    const client = await this.prisma.fAClient.findFirst({
      where: { id: clientId, advisorId },
    });
    if (!client) throw new NotFoundException('Client not found');

    const issues: string[] = [];

    // KYC check
    if (client.kycStatus !== 'VERIFIED') {
      issues.push(`Client KYC status is ${client.kycStatus}`);
    }

    // Check if assigned RM has valid EUIN
    if (client.assignedRmId) {
      const rm = await this.prisma.fAStaffMember.findUnique({
        where: { id: client.assignedRmId },
      });
      if (rm?.euinExpiry && rm.euinExpiry < new Date()) {
        issues.push(`Assigned RM's EUIN has expired (${rm.displayName})`);
      }
    }

    // Check compliance records for the advisor
    const expiredRecords = await this.prisma.complianceRecord.findMany({
      where: { advisorId, status: 'EXPIRED' },
    });
    if (expiredRecords.length > 0) {
      issues.push(`${expiredRecords.length} compliance record(s) are expired`);
    }

    return {
      clientId,
      clientName: client.name,
      kycStatus: client.kycStatus,
      suitability: issues.length === 0 ? 'PASS' : 'FAIL',
      issueCount: issues.length,
      issues,
    };
  }

  private computeStatus(expiryDate: Date): string {
    const now = new Date();
    if (expiryDate < now) return 'EXPIRED';
    const sixtyDays = new Date();
    sixtyDays.setDate(sixtyDays.getDate() + 60);
    if (expiryDate <= sixtyDays) return 'EXPIRING_SOON';
    return 'VALID';
  }

  private transformRecord(r: any) {
    const now = new Date();
    const diffMs = r.expiryDate.getTime() - now.getTime();
    const daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return {
      id: r.id,
      type: r.type,
      entityId: r.entityId,
      entityName: r.entityName,
      expiryDate: r.expiryDate.toISOString().split('T')[0],
      status: r.status,
      documentUrl: r.documentUrl,
      notes: r.notes,
      daysUntilExpiry,
      createdAt: r.createdAt.toISOString(),
    };
  }
}
