import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { CommissionsParser } from './commissions.parser';
import { EuinCommissionService } from '../euin-commission/euin-commission.service';
import {
  CreateRateDto, UpdateRateDto, CommissionFilterDto,
  CalculateExpectedDto, ReconcileDto, ReconcileAndComputeDto,
} from './dto';
import { DEFAULT_COMMISSION_RATES } from './data/default-commission-rates';

@Injectable()
export class CommissionsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditLogService,
    private parser: CommissionsParser,
    private euinCommissionService: EuinCommissionService,
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
    // Resolve ARN — use provided or default from OrganizationArn
    const arnNumber = await this.resolveArn(advisorId, dto.arnNumber);

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

      // Find existing or create — use findFirst + update/create since arnNumber can be null
      const existing = await this.prisma.commissionRecord.findFirst({
        where: {
          advisorId,
          period: dto.period,
          amcId: data.amcId,
          arnNumber: arnNumber ?? null,
        },
      });

      let record;
      if (existing) {
        record = await this.prisma.commissionRecord.update({
          where: { id: existing.id },
          data: { aumAmount: data.aumAmount, expectedTrail },
        });
      } else {
        record = await this.prisma.commissionRecord.create({
          data: {
            advisorId,
            period: dto.period,
            amcId: data.amcId,
            arnNumber: arnNumber ?? null,
            aumAmount: data.aumAmount,
            expectedTrail,
            status: 'EXPECTED',
          },
        });
      }

      records.push(record);
    }

    await this.audit.log({ userId, action: 'CALCULATE_EXPECTED_COMMISSIONS', entityType: 'CommissionRecord', newValue: { period: dto.period, recordCount: records.length, arnNumber } });

    return {
      period: dto.period,
      arnNumber,
      recordCount: records.length,
      totalExpectedTrail: records.reduce((sum, r) => sum + Number(r.expectedTrail), 0),
    };
  }

  // ============= CSV UPLOAD =============

  async uploadBrokerage(
    advisorId: string,
    userId: string,
    file: { originalname: string; buffer: Buffer; mimetype: string },
    arnNumber?: string,
  ) {
    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      throw new BadRequestException('Only CSV files are accepted');
    }

    const csvContent = file.buffer.toString('utf-8');
    const parseResult = this.parser.parse(csvContent);

    // Aggregate brokerage by AMC
    const amcBrokerage = new Map<string, number>();
    for (const row of parseResult.rows) {
      const key = row.amcName.toLowerCase();
      amcBrokerage.set(key, (amcBrokerage.get(key) || 0) + row.brokerageAmount);
    }

    const totalBrokerage = parseResult.rows.reduce((sum, r) => sum + r.brokerageAmount, 0);
    const effectiveArn = arnNumber || parseResult.detectedArn || null;

    const upload = await this.prisma.brokerageUpload.create({
      data: {
        advisorId,
        fileName: file.originalname,
        source: parseResult.source,
        arnNumber: effectiveArn,
        totalBrokerage,
        recordCount: parseResult.rows.length,
        status: 'COMPLETED',
        parsedData: {
          rows: parseResult.rows.slice(0, 100),
          summary: Object.fromEntries(amcBrokerage),
          totalBrokerage,
        } as any,
      },
    });

    // Bulk-create line items
    if (parseResult.rows.length > 0) {
      await this.prisma.brokerageLineItem.createMany({
        data: parseResult.rows.map(row => ({
          uploadId: upload.id,
          amcName: row.amcName,
          schemeName: row.schemeName || null,
          schemeCode: row.schemeCode || null,
          isin: row.isin || null,
          folioNo: row.folioNo || null,
          investorName: row.investorName || null,
          transactionType: row.transactionType || null,
          aum: row.amount || 0,
          grossCommission: row.grossCommission || 0,
          tds: row.tds || 0,
          netCommission: row.netCommission || 0,
          euin: row.euin || null,
          arnNumber: row.arnNumber || effectiveArn,
        })),
      });
    }

    await this.audit.log({ userId, action: 'UPLOAD_BROKERAGE', entityType: 'BrokerageUpload', entityId: upload.id });

    return {
      id: upload.id,
      fileName: upload.fileName,
      source: upload.source,
      recordCount: upload.recordCount,
      status: upload.status,
      totalBrokerage,
      amcBreakdown: Object.fromEntries(amcBrokerage),
      arnNumber: effectiveArn,
      granularity: parseResult.granularity,
      detectedArn: parseResult.detectedArn,
      lineItemCount: parseResult.rows.length,
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
      totalBrokerage: Number(u.totalBrokerage) || (u.parsedData as any)?.totalBrokerage || 0,
      arnNumber: u.arnNumber,
      createdAt: u.createdAt.toISOString(),
    }));
  }

  // ============= RECONCILIATION =============

  async reconcile(advisorId: string, userId: string, dto: ReconcileDto) {
    const arnNumber = await this.resolveArn(advisorId, dto.arnNumber);

    // Get expected records for this period (filtered by ARN)
    const where: any = { advisorId, period: dto.period };
    if (arnNumber) where.arnNumber = arnNumber;

    const expectedRecords = await this.prisma.commissionRecord.findMany({ where });

    // Get latest upload — prefer matching ARN
    let latestUpload = await this.prisma.brokerageUpload.findFirst({
      where: { advisorId, status: 'COMPLETED', ...(arnNumber ? { arnNumber } : {}) },
      orderBy: { createdAt: 'desc' },
    });
    if (!latestUpload) {
      latestUpload = await this.prisma.brokerageUpload.findFirst({
        where: { advisorId, status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!latestUpload) {
      throw new BadRequestException('No uploaded brokerage data found. Please upload a CSV first.');
    }

    // Aggregate actuals from line items by AMC
    const lineItems = await this.prisma.brokerageLineItem.findMany({
      where: { uploadId: latestUpload.id },
    });

    const actualByAmc = new Map<string, number>();
    for (const item of lineItems) {
      const key = item.amcName.toLowerCase();
      const amount = Number(item.netCommission) || Number(item.grossCommission) || 0;
      actualByAmc.set(key, (actualByAmc.get(key) || 0) + amount);
    }

    // Fallback to JSON summary if no line items exist
    if (lineItems.length === 0 && latestUpload.parsedData) {
      const summary = (latestUpload.parsedData as any)?.summary || {};
      for (const [amcName, amount] of Object.entries(summary)) {
        actualByAmc.set(amcName.toLowerCase(), amount as number);
      }
    }

    // Match AMCs and update records
    const results: any[] = [];
    let matchedCount = 0;
    let discrepancyCount = 0;

    for (const record of expectedRecords) {
      const amc = await this.prisma.provider.findUnique({
        where: { id: record.amcId },
        select: { name: true, shortName: true },
      });

      if (!amc) continue;

      const amcNameLower = amc.name.toLowerCase();
      const shortNameLower = amc.shortName?.toLowerCase() || '';
      let actualTrail = 0;

      // Match by AMC name (fuzzy)
      for (const [uploadAmcName, amount] of actualByAmc) {
        if (uploadAmcName.includes(amcNameLower) || amcNameLower.includes(uploadAmcName) ||
            (shortNameLower && (uploadAmcName.includes(shortNameLower) || shortNameLower.includes(uploadAmcName)))) {
          actualTrail = amount;
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
        data: {
          actualTrail,
          status,
          reconciledAt: status === 'RECONCILED' || status === 'DISCREPANCY' ? new Date() : null,
          reconciledBy: status === 'RECONCILED' || status === 'DISCREPANCY' ? userId : null,
        },
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
        arnNumber: updated.arnNumber,
        reconciledAt: updated.reconciledAt?.toISOString() || null,
      });
    }

    await this.audit.log({ userId, action: 'RECONCILE_COMMISSIONS', entityType: 'CommissionRecord', newValue: { period: dto.period, matchedCount, discrepancyCount, arnNumber } });

    return {
      period: dto.period,
      arnNumber,
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
    if (filters.arnNumber) where.arnNumber = filters.arnNumber;

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
        arnNumber: r.arnNumber,
        reconciledAt: r.reconciledAt?.toISOString() || null,
        reconciledBy: r.reconciledBy,
      };
    });
  }

  async getDiscrepancies(advisorId: string) {
    return this.listRecords(advisorId, { status: 'DISCREPANCY' });
  }

  // ============= LINE ITEM DRILL-DOWN =============

  async getRecordLineItems(recordId: string, advisorId: string) {
    const record = await this.prisma.commissionRecord.findFirst({
      where: { id: recordId, advisorId },
    });
    if (!record) throw new NotFoundException('Commission record not found');

    const amc = await this.prisma.provider.findUnique({
      where: { id: record.amcId },
      select: { name: true, shortName: true },
    });

    // Find uploads for matching period
    const uploads = await this.prisma.brokerageUpload.findMany({
      where: {
        advisorId,
        status: 'COMPLETED',
        ...(record.arnNumber ? { arnNumber: record.arnNumber } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true },
    });

    if (uploads.length === 0) return [];

    const uploadIds = uploads.map(u => u.id);
    const amcNameLower = amc?.name.toLowerCase() || '';
    const shortNameLower = amc?.shortName?.toLowerCase() || '';

    // Get all line items from relevant uploads and filter by AMC name
    const allItems = await this.prisma.brokerageLineItem.findMany({
      where: { uploadId: { in: uploadIds } },
    });

    return allItems
      .filter(item => {
        const itemAmc = item.amcName.toLowerCase();
        return itemAmc.includes(amcNameLower) || amcNameLower.includes(itemAmc) ||
          (shortNameLower && (itemAmc.includes(shortNameLower) || shortNameLower.includes(itemAmc)));
      })
      .map(item => ({
        id: item.id,
        uploadId: item.uploadId,
        amcName: item.amcName,
        schemeName: item.schemeName,
        schemeCode: item.schemeCode,
        isin: item.isin,
        folioNo: item.folioNo,
        investorName: item.investorName,
        transactionType: item.transactionType,
        aum: Number(item.aum),
        grossCommission: Number(item.grossCommission),
        tds: Number(item.tds),
        netCommission: Number(item.netCommission),
        euin: item.euin,
        arnNumber: item.arnNumber,
      }));
  }

  async getUploadLineItems(uploadId: string, advisorId: string, filters?: { amcName?: string; arnNumber?: string }) {
    // Verify ownership
    const upload = await this.prisma.brokerageUpload.findFirst({
      where: { id: uploadId, advisorId },
    });
    if (!upload) throw new NotFoundException('Upload not found');

    const where: any = { uploadId };
    if (filters?.arnNumber) where.arnNumber = filters.arnNumber;

    const items = await this.prisma.brokerageLineItem.findMany({
      where,
      orderBy: { amcName: 'asc' },
    });

    let result = items;
    if (filters?.amcName) {
      const filterLower = filters.amcName.toLowerCase();
      result = items.filter(i => i.amcName.toLowerCase().includes(filterLower));
    }

    return result.map(item => ({
      id: item.id,
      uploadId: item.uploadId,
      amcName: item.amcName,
      schemeName: item.schemeName,
      schemeCode: item.schemeCode,
      isin: item.isin,
      folioNo: item.folioNo,
      investorName: item.investorName,
      transactionType: item.transactionType,
      aum: Number(item.aum),
      grossCommission: Number(item.grossCommission),
      tds: Number(item.tds),
      netCommission: Number(item.netCommission),
      euin: item.euin,
      arnNumber: item.arnNumber,
    }));
  }

  // ============= RECONCILE + COMPUTE EUIN =============

  async reconcileAndCompute(advisorId: string, userId: string, dto: ReconcileAndComputeDto) {
    // Step 1: Reconcile
    const reconResult = await this.reconcile(advisorId, userId, {
      period: dto.period,
      arnNumber: dto.arnNumber,
    });

    // Step 2: If any RECONCILED records, compute EUIN payouts
    let euinResult: { computed: number; message?: string } = { computed: 0, message: 'No reconciled records to compute payouts from' };
    if (reconResult.matched > 0) {
      euinResult = await this.euinCommissionService.computePayouts(advisorId, { period: dto.period });
    }

    return {
      reconciliation: {
        period: reconResult.period,
        arnNumber: reconResult.arnNumber,
        totalRecords: reconResult.totalRecords,
        matched: reconResult.matched,
        discrepancies: reconResult.discrepancies,
      },
      euinPayouts: euinResult,
    };
  }

  // ============= ARN SUMMARY =============

  async getSummaryByArn(advisorId: string) {
    // Get all ARNs for this advisor
    const arns = await this.prisma.organizationArn.findMany({
      where: { advisorId, isActive: true },
      select: { arnNumber: true, label: true },
    });

    const summaries: Array<{
      arnNumber: string; label: string | null;
      totalAum: number; expectedTrail: number; actualTrail: number;
      reconciledCount: number; discrepancyCount: number; pendingCount: number;
    }> = [];
    for (const arn of arns) {
      const records = await this.prisma.commissionRecord.findMany({
        where: { advisorId, arnNumber: arn.arnNumber },
      });

      summaries.push({
        arnNumber: arn.arnNumber,
        label: arn.label,
        totalAum: records.reduce((s, r) => s + Number(r.aumAmount), 0),
        expectedTrail: records.reduce((s, r) => s + Number(r.expectedTrail), 0),
        actualTrail: records.reduce((s, r) => s + Number(r.actualTrail), 0),
        reconciledCount: records.filter(r => r.status === 'RECONCILED').length,
        discrepancyCount: records.filter(r => r.status === 'DISCREPANCY').length,
        pendingCount: records.filter(r => r.status === 'EXPECTED').length,
      });
    }

    return summaries;
  }

  // ============= DEFAULTS (ONBOARDING) =============

  async getDefaults() {
    // Try to match AMC short names to Provider records
    const providers = await this.prisma.provider.findMany({
      where: { isActive: true },
      select: { id: true, name: true, shortName: true },
    });

    return DEFAULT_COMMISSION_RATES.map(rate => {
      const provider = providers.find(p =>
        p.shortName?.toLowerCase() === rate.amcShortName.toLowerCase() ||
        p.name?.toLowerCase().includes(rate.amcShortName.toLowerCase()),
      );
      return {
        amcShortName: rate.amcShortName,
        amcId: provider?.id || null,
        amcFullName: provider?.name || rate.amcShortName,
        schemeCategory: rate.schemeCategory,
        trailRatePercent: rate.trailRatePercent,
        upfrontRatePercent: rate.upfrontRatePercent,
      };
    });
  }

  async bulkCreateRates(
    advisorId: string,
    userId: string,
    rates: { amcId: string; schemeCategory: string; trailRatePercent: number; upfrontRatePercent?: number; effectiveFrom: string }[],
  ) {
    let created = 0;
    let skipped = 0;

    for (const rate of rates) {
      // Check if rate already exists for this AMC + category
      const existing = await this.prisma.commissionRateMaster.findFirst({
        where: {
          advisorId,
          amcId: rate.amcId,
          schemeCategory: rate.schemeCategory,
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await this.prisma.commissionRateMaster.create({
        data: {
          advisorId,
          amcId: rate.amcId,
          schemeCategory: rate.schemeCategory,
          trailRatePercent: rate.trailRatePercent,
          upfrontRatePercent: rate.upfrontRatePercent || 0,
          effectiveFrom: new Date(rate.effectiveFrom),
        },
      });
      created++;
    }

    await this.audit.log({
      userId,
      action: 'BULK_CREATE_RATES',
      entityType: 'CommissionRateMaster',
      entityId: advisorId,
      details: { created, skipped, total: rates.length },
    });

    return { created, skipped, total: rates.length };
  }

  // ============= HELPERS =============

  private async resolveArn(advisorId: string, providedArn?: string): Promise<string | null> {
    if (providedArn) return providedArn;

    // Try to get default ARN from OrganizationArn
    const defaultArn = await this.prisma.organizationArn.findFirst({
      where: { advisorId, isDefault: true, isActive: true },
      select: { arnNumber: true },
    });

    return defaultArn?.arnNumber || null;
  }
}
