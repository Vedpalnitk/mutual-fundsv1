import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

// casparser transaction type → FATransactionType mapping
const TXN_TYPE_MAP: Record<string, string> = {
  PURCHASE: 'BUY',
  PURCHASE_SIP: 'BUY',
  REDEMPTION: 'SELL',
  REVERSAL: 'SELL',
  SWITCH_IN: 'SWITCH',
  SWITCH_OUT: 'SWITCH',
  SWITCH_IN_MERGER: 'SWITCH',
  SWITCH_OUT_MERGER: 'SWITCH',
};

// Transaction types to skip (informational / tax entries)
const SKIP_TXN_TYPES = new Set([
  'DIVIDEND_PAYOUT',
  'DIVIDEND_REINVEST',
  'STT_TAX',
  'STAMP_DUTY_TAX',
  'TDS_TAX',
  'SEGREGATION',
  'MISC',
  'UNKNOWN',
]);

interface MLCASScheme {
  scheme: string;
  isin: string | null;
  amfi: string | null;
  rta: string;
  rta_code: string;
  advisor: string | null;
  type: string | null;
  open: number;
  close: number;
  valuation_date: string | null;
  valuation_nav: number | null;
  valuation_value: number | null;
  cost: number | null;
  transactions: MLCASTransaction[];
}

interface MLCASTransaction {
  date: string;
  description: string;
  amount: number | null;
  units: number | null;
  nav: number | null;
  balance: number | null;
  type: string;
}

interface MLCASFolio {
  folio: string;
  amc: string;
  pan: string | null;
  kyc: string | null;
  schemes: MLCASScheme[];
}

interface MLCASParseResponse {
  investor_name: string;
  investor_email: string;
  investor_mobile: string;
  cas_type: string;
  file_type: string;
  statement_period_from: string;
  statement_period_to: string;
  folios: MLCASFolio[];
  total_schemes: number;
  total_current_value: number;
}

@Injectable()
export class CasImportService {
  private readonly logger = new Logger(CasImportService.name);
  private readonly mlServiceUrl: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.mlServiceUrl = this.config.get('mlService.httpUrl') || 'http://localhost:8000';
  }

  async importCas(
    userId: string,
    file: { buffer: Buffer; originalname?: string; mimetype?: string; size?: number },
    password: string,
    clientId?: string,
  ) {
    // Validate file
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('No file provided');
    }
    if (file.mimetype && file.mimetype !== 'application/pdf') {
      throw new BadRequestException('File must be a PDF');
    }
    if (file.buffer.length > 10 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    // Determine context
    const isFA = !!clientId;

    // If FA context, verify advisor owns the client
    if (isFA) {
      const client = await this.prisma.fAClient.findFirst({
        where: { id: clientId, advisorId: userId },
      });
      if (!client) {
        throw new ForbiddenException('Client not found or not owned by this advisor');
      }
    }

    // Create CASImport record
    const casImport = await this.prisma.cASImport.create({
      data: {
        userId,
        clientId: isFA ? clientId : null,
        context: isFA ? 'FA_CLIENT' : 'SELF',
        status: 'PROCESSING',
      },
    });

    try {
      // Forward to ML service
      const parsed = await this.callMLService(file.buffer, password);

      // Store parsed data
      if (isFA) {
        await this.storeFA(userId, clientId!, parsed);
      } else {
        await this.storeSelf(userId, parsed);
      }

      // Parse dates safely
      const periodFrom = this.parseDate(parsed.statement_period_from);
      const periodTo = this.parseDate(parsed.statement_period_to);

      // Update import record
      const updated = await this.prisma.cASImport.update({
        where: { id: casImport.id },
        data: {
          status: 'COMPLETED',
          investorName: parsed.investor_name || null,
          investorEmail: parsed.investor_email || null,
          casType: parsed.cas_type || null,
          fileType: parsed.file_type || null,
          periodFrom,
          periodTo,
          foliosImported: parsed.folios.length,
          schemesImported: parsed.total_schemes,
          totalValue: parsed.total_current_value ? new Decimal(parsed.total_current_value) : null,
        },
      });

      return {
        id: updated.id,
        status: updated.status,
        context: updated.context,
        investorName: updated.investorName,
        investorEmail: updated.investorEmail,
        foliosImported: updated.foliosImported,
        schemesImported: updated.schemesImported,
        totalValue: updated.totalValue ? Number(updated.totalValue) : null,
        createdAt: updated.createdAt,
      };
    } catch (error) {
      // Update import record with error
      await this.prisma.cASImport.update({
        where: { id: casImport.id },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  }

  async getImports(userId: string) {
    const imports = await this.prisma.cASImport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return imports.map((i) => ({
      ...i,
      totalValue: i.totalValue ? Number(i.totalValue) : null,
    }));
  }

  async getClientImports(userId: string, clientId: string) {
    // Verify advisor owns the client
    const client = await this.prisma.fAClient.findFirst({
      where: { id: clientId, advisorId: userId },
    });
    if (!client) {
      throw new ForbiddenException('Client not found or not owned by this advisor');
    }

    const imports = await this.prisma.cASImport.findMany({
      where: { clientId, userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return imports.map((i) => ({
      ...i,
      totalValue: i.totalValue ? Number(i.totalValue) : null,
    }));
  }

  private async callMLService(fileBuffer: Buffer, password: string): Promise<MLCASParseResponse> {
    const formData = new FormData();
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength,
    ) as ArrayBuffer;
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    formData.append('file', blob, 'cas.pdf');
    formData.append('password', password);

    const response = await fetch(`${this.mlServiceUrl}/api/v1/cas/parse`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'ML service error' }));
      const message = error.detail || error.message || 'Failed to parse CAS PDF';
      throw new BadRequestException(message);
    }

    return response.json();
  }

  private async storeFA(advisorId: string, clientId: string, parsed: MLCASParseResponse) {
    for (const folio of parsed.folios) {
      for (const scheme of folio.schemes) {
        // Try to find SchemePlan by ISIN, then by AMFI code
        const schemePlan = await this.findSchemePlan(scheme.isin, scheme.amfi);

        const fundSchemeCode = scheme.isin || scheme.amfi || scheme.rta_code || scheme.scheme;
        const fundCategory = scheme.type || 'Other';
        const assetClass = this.mapAssetClass(fundCategory);

        const investedValue = scheme.cost ?? 0;
        const currentValue = scheme.valuation_value ?? 0;
        const absoluteGain = currentValue - investedValue;
        const absoluteGainPct = investedValue > 0 ? (absoluteGain / investedValue) * 100 : 0;

        // Find latest transaction date
        const lastTxnDate = this.findLastTransactionDate(scheme.transactions);

        // Upsert FAHolding
        await this.prisma.fAHolding.upsert({
          where: {
            clientId_folioNumber_fundSchemeCode: {
              clientId,
              folioNumber: folio.folio,
              fundSchemeCode,
            },
          },
          create: {
            clientId,
            schemePlanId: schemePlan?.id || null,
            fundName: scheme.scheme,
            fundSchemeCode,
            fundCategory,
            assetClass,
            folioNumber: folio.folio,
            units: new Decimal(scheme.close || 0),
            avgNav: new Decimal(investedValue && scheme.close ? investedValue / scheme.close : 0),
            currentNav: new Decimal(scheme.valuation_nav || 0),
            investedValue: new Decimal(investedValue),
            currentValue: new Decimal(currentValue),
            absoluteGain: new Decimal(absoluteGain),
            absoluteGainPct: new Decimal(absoluteGainPct),
            lastTxnDate: lastTxnDate || new Date(),
          },
          update: {
            schemePlanId: schemePlan?.id || undefined,
            fundName: scheme.scheme,
            fundCategory,
            assetClass,
            units: new Decimal(scheme.close || 0),
            currentNav: new Decimal(scheme.valuation_nav || 0),
            investedValue: new Decimal(investedValue),
            currentValue: new Decimal(currentValue),
            absoluteGain: new Decimal(absoluteGain),
            absoluteGainPct: new Decimal(absoluteGainPct),
            lastTxnDate: lastTxnDate || new Date(),
          },
        });

        // Create FATransaction records (skip duplicates by checking existing)
        for (const txn of scheme.transactions) {
          const mappedType = TXN_TYPE_MAP[txn.type];
          if (!mappedType || SKIP_TXN_TYPES.has(txn.type)) continue;

          const txnDate = this.parseDate(txn.date);
          if (!txnDate) continue;

          const txnAmount = new Decimal(Math.abs(txn.amount || 0));
          const txnUnits = new Decimal(Math.abs(txn.units || 0));
          const txnNav = new Decimal(txn.nav || 0);

          // Check for existing transaction to avoid duplicates on re-import
          const existing = await this.prisma.fATransaction.findFirst({
            where: {
              clientId,
              folioNumber: folio.folio,
              fundSchemeCode,
              date: txnDate,
              type: mappedType as any,
              amount: txnAmount,
            },
          });
          if (existing) continue;

          await this.prisma.fATransaction.create({
            data: {
              clientId,
              schemePlanId: schemePlan?.id || null,
              fundName: scheme.scheme,
              fundSchemeCode,
              fundCategory,
              type: mappedType as any,
              amount: txnAmount,
              units: txnUnits,
              nav: txnNav,
              status: 'COMPLETED',
              date: txnDate,
              folioNumber: folio.folio,
              remarks: `CAS Import: ${txn.description}`,
            },
          });
        }
      }
    }
  }

  private async storeSelf(userId: string, parsed: MLCASParseResponse) {
    for (const folio of parsed.folios) {
      // Find or match Provider by AMC name
      const provider = await this.prisma.provider.findFirst({
        where: { name: { contains: folio.amc, mode: 'insensitive' } },
      });

      if (!provider) {
        this.logger.warn(`No Provider found for AMC=${folio.amc} — skipping folio ${folio.folio}`);
        continue;
      }

      const providerId = provider.id;
      const pan = folio.pan || '';

      // Upsert Folio
      const folioRecord = await this.prisma.folio.upsert({
        where: {
          userId_providerId_folioNumber: {
            userId,
            providerId,
            folioNumber: folio.folio,
          },
        },
        create: {
          userId,
          providerId,
          folioNumber: folio.folio,
          panNumber: pan,
        },
        update: {
          panNumber: pan || undefined,
        },
      });

      for (const scheme of folio.schemes) {
        const schemePlan = await this.findSchemePlan(scheme.isin, scheme.amfi);
        if (!schemePlan) {
          this.logger.warn(`No SchemePlan found for ISIN=${scheme.isin} AMFI=${scheme.amfi} — skipping holding`);
          continue;
        }

        const investedValue = scheme.cost ?? 0;
        const currentValue = scheme.valuation_value ?? 0;
        const avgNav = scheme.close && investedValue ? investedValue / scheme.close : 0;

        await this.prisma.holding.upsert({
          where: {
            folioId_schemePlanId: {
              folioId: folioRecord.id,
              schemePlanId: schemePlan.id,
            },
          },
          create: {
            folioId: folioRecord.id,
            schemePlanId: schemePlan.id,
            units: new Decimal(scheme.close || 0),
            investedAmount: new Decimal(investedValue),
            currentValue: currentValue ? new Decimal(currentValue) : null,
            averageNav: avgNav ? new Decimal(avgNav) : null,
          },
          update: {
            units: new Decimal(scheme.close || 0),
            investedAmount: new Decimal(investedValue),
            currentValue: currentValue ? new Decimal(currentValue) : null,
            averageNav: avgNav ? new Decimal(avgNav) : null,
          },
        });
      }
    }
  }

  private async findSchemePlan(isin: string | null, amfi: string | null) {
    if (isin) {
      const plan = await this.prisma.schemePlan.findUnique({ where: { isin } });
      if (plan) return plan;
    }
    if (amfi) {
      const amfiCode = parseInt(amfi, 10);
      if (!isNaN(amfiCode)) {
        const plan = await this.prisma.schemePlan.findFirst({
          where: { mfapiSchemeCode: amfiCode },
        });
        if (plan) return plan;
      }
    }
    return null;
  }

  private mapAssetClass(type: string | null): string {
    if (!type) return 'Other';
    const t = type.toUpperCase();
    if (t.includes('EQUITY')) return 'Equity';
    if (t.includes('DEBT') || t.includes('BOND')) return 'Debt';
    if (t.includes('HYBRID') || t.includes('BALANCED')) return 'Hybrid';
    if (t.includes('GOLD')) return 'Gold';
    if (t.includes('INTERNATIONAL') || t.includes('OVERSEAS')) return 'International';
    if (t.includes('LIQUID') || t.includes('MONEY')) return 'Liquid';
    return 'Other';
  }

  private parseDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr || dateStr === '') return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }

  private findLastTransactionDate(transactions: MLCASTransaction[]): Date | null {
    let latest: Date | null = null;
    for (const txn of transactions) {
      const d = this.parseDate(txn.date);
      if (d && (!latest || d > latest)) {
        latest = d;
      }
    }
    return latest;
  }
}
