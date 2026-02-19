import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CommissionsParser } from './commissions.parser';
import {
  CreateRateDto, UpdateRateDto, CommissionFilterDto,
  CalculateExpectedDto, ReconcileDto,
} from './dto';

@Injectable()
export class CommissionsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private parser: CommissionsParser,
  ) {}

  // ============= RATE MASTER =============

  async listRates(advisorId: string) {
    const rates = await this.prisma.commissionRateMaster.findMany({
      where: { advisorId },
      include: { amc: { select: { id: true, name: true, shortName: true } } },
      orderBy: [{ amc: { name: 'asc' } }, { schemeCategory: 'asc' }],
    });

    return rates.map(r => ({
      id: r.id,
      amcId: r.amcId,
      amcName: r.amc.name,
      amcShortName: r.amc.shortName,
      schemeCategory: r.schemeCategory,
      trailRatePercent: Number(r.trailRatePercent),
      upfrontRatePercent: Number(r.upfrontRatePercent),
      effectiveFrom: r.effectiveFrom.toISOString().split('T')[0],
      effectiveTo: r.effectiveTo?.toISOString().split('T')[0] || null,
    }));
  }

  async createRate(advisorId: string, userId: string, dto: CreateRateDto) {
    const rate = await this.prisma.commissionRateMaster.create({
      data: {
        advisorId,
        amcId: dto.amcId,
        schemeCategory: dto.schemeCategory,
        trailRatePercent: dto.trailRatePercent,
        upfrontRatePercent: dto.upfrontRatePercent || 0,
        effectiveFrom: new Date(dto.effectiveFrom),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
      },
      include: { amc: { select: { id: true, name: true } } },
    });

    await this.audit.log({ userId, action: 'CREATE_COMMISSION_RATE', entityType: 'CommissionRateMaster', entityId: rate.id });

    return {
      id: rate.id,
      amcId: rate.amcId,
      amcName: rate.amc.name,
      schemeCategory: rate.schemeCategory,
      trailRatePercent: Number(rate.trailRatePercent),
      upfrontRatePercent: Number(rate.upfrontRatePercent),
      effectiveFrom: rate.effectiveFrom.toISOString().split('T')[0],
      effectiveTo: rate.effectiveTo?.toISOString().split('T')[0] || null,
    };
  }

  async updateRate(id: string, advisorId: string, userId: string, dto: UpdateRateDto) {
    const existing = await this.prisma.commissionRateMaster.findFirst({
      where: { id, advisorId },
    });
    if (!existing) throw new NotFoundException('Commission rate not found');

    const rate = await this.prisma.commissionRateMaster.update({
      where: { id },
      data: {
        trailRatePercent: dto.trailRatePercent,
        upfrontRatePercent: dto.upfrontRatePercent,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : undefined,
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
      },
      include: { amc: { select: { id: true, name: true } } },
    });

    await this.audit.log({ userId, action: 'UPDATE_COMMISSION_RATE', entityType: 'CommissionRateMaster', entityId: rate.id });

    return {
      id: rate.id,
      amcId: rate.amcId,
      amcName: rate.amc.name,
      schemeCategory: rate.schemeCategory,
      trailRatePercent: Number(rate.trailRatePercent),
      upfrontRatePercent: Number(rate.upfrontRatePercent),
      effectiveFrom: rate.effectiveFrom.toISOString().split('T')[0],
      effectiveTo: rate.effectiveTo?.toISOString().split('T')[0] || null,
    };
  }

  async deleteRate(id: string, advisorId: string, userId: string) {
    const existing = await this.prisma.commissionRateMaster.findFirst({
      where: { id, advisorId },
    });
    if (!existing) throw new NotFoundException('Commission rate not found');

    await this.prisma.commissionRateMaster.delete({ where: { id } });
    await this.audit.log({ userId, action: 'DELETE_COMMISSION_RATE', entityType: 'CommissionRateMaster', entityId: id });

    return { success: true };
  }

  // ============= EXPECTED CALCULATION =============

  async calculateExpected(advisorId: string, userId: string, dto: CalculateExpectedDto) {
    // Get all holdings grouped by AMC/category
    const holdings = await this.prisma.fAHolding.findMany({
      where: {
        client: { advisorId },
      },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    // Get commission rates
    const rates = await this.prisma.commissionRateMaster.findMany({
      where: {
        advisorId,
        effectiveFrom: { lte: new Date(`${dto.period}-01`) },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date(`${dto.period}-01`) } },
        ],
      },
      include: { amc: true },
    });

    // Build rate lookup: amcId+category -> rate
    const rateLookup = new Map<string, { trail: number; upfront: number; amcId: string }>();
    for (const r of rates) {
      const key = `${r.amcId}:${r.schemeCategory}`;
      rateLookup.set(key, {
        trail: Number(r.trailRatePercent),
        upfront: Number(r.upfrontRatePercent),
        amcId: r.amcId,
      });
    }

    // Group holdings by AMC (using fundSchemeCode prefix or category)
    const amcAum = new Map<string, { aumAmount: number; amcId: string }>();
    for (const h of holdings) {
      // Match against rate master categories
      const category = h.assetClass || h.fundCategory || 'EQUITY';
      for (const [key, rate] of rateLookup) {
        const [amcId, rateCategory] = key.split(':');
        if (rateCategory.toLowerCase() === category.toLowerCase()) {
          const existing = amcAum.get(key) || { aumAmount: 0, amcId };
          existing.aumAmount += Number(h.currentValue || 0);
          amcAum.set(key, existing);
        }
      }
    }

    // Create/update commission records
    const records: any[] = [];
    for (const [key, data] of amcAum) {
      const rate = rateLookup.get(key);
      if (!rate) continue;

      const expectedTrail = (data.aumAmount * rate.trail) / 100 / 12; // Monthly trail

      const record = await this.prisma.commissionRecord.upsert({
        where: {
          advisorId_period_amcId: {
            advisorId,
            period: dto.period,
            amcId: data.amcId,
          },
        },
        update: {
          aumAmount: data.aumAmount,
          expectedTrail,
        },
        create: {
          advisorId,
          period: dto.period,
          amcId: data.amcId,
          aumAmount: data.aumAmount,
          expectedTrail,
          status: 'EXPECTED',
        },
      });

      records.push(record);
    }

    await this.audit.log({ userId, action: 'CALCULATE_EXPECTED_COMMISSIONS', entityType: 'CommissionRecord', newValue: { period: dto.period, recordCount: records.length } });

    return {
      period: dto.period,
      recordCount: records.length,
      totalExpectedTrail: records.reduce((sum, r) => sum + Number(r.expectedTrail), 0),
    };
  }

  // ============= CSV UPLOAD =============

  async uploadBrokerage(
    advisorId: string,
    userId: string,
    file: { originalname: string; buffer: Buffer; mimetype: string },
  ) {
    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      throw new BadRequestException('Only CSV files are accepted');
    }

    const csvContent = file.buffer.toString('utf-8');
    const { source, rows } = this.parser.parse(csvContent);

    // Aggregate brokerage by AMC
    const amcBrokerage = new Map<string, number>();
    for (const row of rows) {
      const key = row.amcName.toLowerCase();
      amcBrokerage.set(key, (amcBrokerage.get(key) || 0) + row.brokerageAmount);
    }

    const upload = await this.prisma.brokerageUpload.create({
      data: {
        advisorId,
        fileName: file.originalname,
        source,
        recordCount: rows.length,
        status: 'COMPLETED',
        parsedData: {
          rows: rows.slice(0, 100),
          summary: Object.fromEntries(amcBrokerage),
          totalBrokerage: rows.reduce((sum, r) => sum + r.brokerageAmount, 0),
        } as any,
      },
    });

    await this.audit.log({ userId, action: 'UPLOAD_BROKERAGE', entityType: 'BrokerageUpload', entityId: upload.id });

    return {
      id: upload.id,
      fileName: upload.fileName,
      source: upload.source,
      recordCount: upload.recordCount,
      status: upload.status,
      totalBrokerage: rows.reduce((sum, r) => sum + r.brokerageAmount, 0),
      amcBreakdown: Object.fromEntries(amcBrokerage),
    };
  }

  async listUploads(advisorId: string) {
    const uploads = await this.prisma.brokerageUpload.findMany({
      where: { advisorId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return uploads.map(u => ({
      id: u.id,
      fileName: u.fileName,
      source: u.source,
      recordCount: u.recordCount,
      status: u.status,
      errorMessage: u.errorMessage,
      totalBrokerage: (u.parsedData as any)?.totalBrokerage || 0,
      createdAt: u.createdAt.toISOString(),
    }));
  }

  // ============= RECONCILIATION =============

  async reconcile(advisorId: string, userId: string, dto: ReconcileDto) {
    // Get expected records for this period
    const expectedRecords = await this.prisma.commissionRecord.findMany({
      where: { advisorId, period: dto.period },
    });

    // Get latest upload's parsed data for actual brokerage
    const latestUpload = await this.prisma.brokerageUpload.findFirst({
      where: { advisorId, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestUpload || !latestUpload.parsedData) {
      throw new BadRequestException('No uploaded brokerage data found. Please upload a CSV first.');
    }

    const actualSummary = (latestUpload.parsedData as any)?.summary || {};

    // Match AMCs and update records
    const results: any[] = [];
    let matchedCount = 0;
    let discrepancyCount = 0;

    for (const record of expectedRecords) {
      // Try to find matching AMC in upload data
      const amc = await this.prisma.provider.findUnique({
        where: { id: record.amcId },
        select: { name: true, shortName: true },
      });

      if (!amc) continue;

      const amcNameLower = amc.name.toLowerCase();
      const shortNameLower = amc.shortName?.toLowerCase() || '';
      let actualTrail = 0;

      // Match by AMC name (fuzzy)
      for (const [uploadAmcName, amount] of Object.entries(actualSummary)) {
        const uploadLower = (uploadAmcName as string).toLowerCase();
        if (uploadLower.includes(amcNameLower) || amcNameLower.includes(uploadLower) ||
            (shortNameLower && (uploadLower.includes(shortNameLower) || shortNameLower.includes(uploadLower)))) {
          actualTrail = amount as number;
          break;
        }
      }

      const expected = Number(record.expectedTrail);
      const threshold = expected * 0.05; // 5% tolerance
      const diff = Math.abs(actualTrail - expected);
      const status = actualTrail === 0 ? 'EXPECTED' : diff <= threshold ? 'RECONCILED' : 'DISCREPANCY';

      if (status === 'RECONCILED') matchedCount++;
      if (status === 'DISCREPANCY') discrepancyCount++;

      const updated = await this.prisma.commissionRecord.update({
        where: { id: record.id },
        data: { actualTrail, status },
      });

      results.push({
        id: updated.id,
        amcId: updated.amcId,
        amcName: amc.name,
        period: updated.period,
        aumAmount: Number(updated.aumAmount),
        expectedTrail: Number(updated.expectedTrail),
        actualTrail: Number(updated.actualTrail),
        difference: Number(updated.actualTrail) - Number(updated.expectedTrail),
        status: updated.status,
      });
    }

    await this.audit.log({ userId, action: 'RECONCILE_COMMISSIONS', entityType: 'CommissionRecord', newValue: { period: dto.period, matchedCount, discrepancyCount } });

    return {
      period: dto.period,
      totalRecords: results.length,
      matched: matchedCount,
      discrepancies: discrepancyCount,
      records: results,
    };
  }

  // ============= RECORDS LISTING =============

  async listRecords(advisorId: string, filters: CommissionFilterDto) {
    const where: any = { advisorId };
    if (filters.period) where.period = filters.period;
    if (filters.amcId) where.amcId = filters.amcId;
    if (filters.status) where.status = filters.status;

    const records = await this.prisma.commissionRecord.findMany({
      where,
      orderBy: [{ period: 'desc' }, { aumAmount: 'desc' }],
    });

    // Fetch AMC names
    const amcIds = [...new Set(records.map(r => r.amcId))];
    const amcs = await this.prisma.provider.findMany({
      where: { id: { in: amcIds } },
      select: { id: true, name: true, shortName: true },
    });
    const amcMap = new Map(amcs.map(a => [a.id, a]));

    return records.map(r => {
      const amc = amcMap.get(r.amcId);
      return {
        id: r.id,
        period: r.period,
        amcId: r.amcId,
        amcName: amc?.name || 'Unknown',
        amcShortName: amc?.shortName || null,
        aumAmount: Number(r.aumAmount),
        expectedTrail: Number(r.expectedTrail),
        actualTrail: Number(r.actualTrail),
        difference: Number(r.actualTrail) - Number(r.expectedTrail),
        status: r.status,
      };
    });
  }

  async getDiscrepancies(advisorId: string) {
    return this.listRecords(advisorId, { status: 'DISCREPANCY' });
  }
}
