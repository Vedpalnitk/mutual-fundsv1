import { Injectable, NotFoundException } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { PrismaService } from '../prisma/prisma.service'
import { CamsWbrParser, WbrRecord } from './parsers/cams-wbr.parser'
import { KfintechMisParser, MisRecord } from './parsers/kfintech-mis.parser'

@Injectable()
export class BulkImportService {
  constructor(
    private prisma: PrismaService,
    private camsParser: CamsWbrParser,
    private kfintechParser: KfintechMisParser,
  ) {}

  async importCamsWbr(
    advisorId: string,
    file: { originalname: string; buffer: Buffer; size: number },
  ) {
    const content = file.buffer.toString('utf-8')
    const { records, errors: parseErrors } = this.camsParser.parse(content)

    const importRecord = await this.prisma.bulkImport.create({
      data: {
        advisorId,
        importType: 'CAMS_WBR',
        fileName: file.originalname,
        fileSize: file.size,
        totalRecords: records.length,
        status: 'PROCESSING',
      },
    })

    try {
      const result = await this.processWbrRecords(advisorId, records)

      const finalErrors = [...parseErrors, ...result.errors]
      await this.prisma.bulkImport.update({
        where: { id: importRecord.id },
        data: {
          status: finalErrors.length > 0 && result.importedClients === 0 ? 'FAILED'
            : finalErrors.length > 0 ? 'PARTIAL' : 'COMPLETED',
          importedClients: result.importedClients,
          importedHoldings: result.importedHoldings,
          skippedRecords: result.skippedRecords,
          errorRecords: finalErrors.length,
          errors: finalErrors.length > 0 ? finalErrors : undefined,
        },
      })

      // Update onboarding import tracking
      await this.prisma.advisorOnboarding.updateMany({
        where: { advisorId },
        data: {
          camsWbrUploaded: true,
          camsWbrImportId: importRecord.id,
        },
      })

      return this.getImportStatus(importRecord.id, advisorId)
    } catch (err) {
      await this.prisma.bulkImport.update({
        where: { id: importRecord.id },
        data: {
          status: 'FAILED',
          errors: [{ row: 0, field: '', message: (err as Error).message }],
        },
      })
      throw err
    }
  }

  async importKfintechMis(
    advisorId: string,
    file: { originalname: string; buffer: Buffer; size: number },
  ) {
    const content = file.buffer.toString('utf-8')
    const { records, errors: parseErrors } = this.kfintechParser.parse(content)

    const importRecord = await this.prisma.bulkImport.create({
      data: {
        advisorId,
        importType: 'KFINTECH_MIS',
        fileName: file.originalname,
        fileSize: file.size,
        totalRecords: records.length,
        status: 'PROCESSING',
      },
    })

    try {
      const result = await this.processMisRecords(advisorId, records)

      const finalErrors = [...parseErrors, ...result.errors]
      await this.prisma.bulkImport.update({
        where: { id: importRecord.id },
        data: {
          status: finalErrors.length > 0 && result.importedClients === 0 ? 'FAILED'
            : finalErrors.length > 0 ? 'PARTIAL' : 'COMPLETED',
          importedClients: result.importedClients,
          importedHoldings: result.importedHoldings,
          skippedRecords: result.skippedRecords,
          errorRecords: finalErrors.length,
          errors: finalErrors.length > 0 ? finalErrors : undefined,
        },
      })

      await this.prisma.advisorOnboarding.updateMany({
        where: { advisorId },
        data: {
          kfintechMisUploaded: true,
          kfintechMisImportId: importRecord.id,
        },
      })

      return this.getImportStatus(importRecord.id, advisorId)
    } catch (err) {
      await this.prisma.bulkImport.update({
        where: { id: importRecord.id },
        data: {
          status: 'FAILED',
          errors: [{ row: 0, field: '', message: (err as Error).message }],
        },
      })
      throw err
    }
  }

  async getImportStatus(id: string, advisorId: string) {
    const record = await this.prisma.bulkImport.findFirst({
      where: { id, advisorId },
    })
    if (!record) throw new NotFoundException('Import not found')

    return {
      id: record.id,
      importType: record.importType,
      fileName: record.fileName,
      fileSize: record.fileSize,
      status: record.status,
      totalRecords: record.totalRecords,
      importedClients: record.importedClients,
      importedHoldings: record.importedHoldings,
      skippedRecords: record.skippedRecords,
      errorRecords: record.errorRecords,
      createdAt: record.createdAt,
    }
  }

  async getImportErrors(id: string, advisorId: string) {
    const record = await this.prisma.bulkImport.findFirst({
      where: { id, advisorId },
    })
    if (!record) throw new NotFoundException('Import not found')
    return (record.errors as any[]) || []
  }

  async getHistory(advisorId: string) {
    const records = await this.prisma.bulkImport.findMany({
      where: { advisorId },
      orderBy: { createdAt: 'desc' },
    })
    return records.map(r => ({
      id: r.id,
      importType: r.importType,
      fileName: r.fileName,
      fileSize: r.fileSize,
      status: r.status,
      totalRecords: r.totalRecords,
      importedClients: r.importedClients,
      importedHoldings: r.importedHoldings,
      skippedRecords: r.skippedRecords,
      errorRecords: r.errorRecords,
      createdAt: r.createdAt,
    }))
  }

  // ── WBR record processing ──
  private async processWbrRecords(advisorId: string, records: WbrRecord[]) {
    // Group by PAN (one PAN = one client)
    const clientMap = new Map<string, WbrRecord[]>()
    for (const r of records) {
      const key = r.pan || r.investorName
      const existing = clientMap.get(key) || []
      existing.push(r)
      clientMap.set(key, existing)
    }

    let importedClients = 0
    let importedHoldings = 0
    let skippedRecords = 0
    const errors: { row: number; field: string; message: string }[] = []

    for (const [panOrName, holdings] of clientMap) {
      try {
        const firstRecord = holdings[0]
        const pan = firstRecord.pan

        // Find existing client by PAN
        let client = pan
          ? await this.prisma.fAClient.findFirst({ where: { advisorId, pan } })
          : null

        if (!client) {
          // Generate placeholder email if not provided (FAClient.email is required)
          const email = firstRecord.email || `import-${randomUUID().slice(0, 8)}@import.placeholder`

          client = await this.prisma.fAClient.create({
            data: {
              advisorId,
              name: firstRecord.investorName,
              pan: pan || null,
              email,
              phone: firstRecord.mobile || 'N/A',
              city: firstRecord.city || null,
              state: firstRecord.state || null,
              pincode: firstRecord.pincode || null,
              kycStatus: 'PENDING',
              tags: ['CAMS_WBR_IMPORT'],
            },
          })
          importedClients++
        }

        for (const h of holdings) {
          try {
            // Resolve schemePlanId from ISIN or AMFI code
            let schemePlanId: string | null = null
            let resolvedFundName = h.schemeName
            let resolvedSchemeCode = ''
            let resolvedCategory = 'Unknown'
            let resolvedAssetClass = 'Unknown'

            if (h.isin) {
              const sp = await this.prisma.schemePlan.findFirst({
                where: { isin: h.isin },
                include: { scheme: { include: { category: true } } },
              })
              if (sp) {
                schemePlanId = sp.id
                resolvedFundName = sp.scheme?.name || h.schemeName
                resolvedSchemeCode = sp.isin || h.isin || ''
                resolvedCategory = sp.scheme?.category?.name || 'Unknown'
                resolvedAssetClass = this.inferAssetClass(resolvedCategory)
              }
            }
            if (!schemePlanId && h.amfiCode) {
              const scheme = await this.prisma.scheme.findFirst({
                where: { mfapiSchemeCode: parseInt(h.amfiCode, 10) },
                include: { schemePlans: { take: 1 }, category: true },
              })
              if (scheme?.schemePlans?.[0]) {
                schemePlanId = scheme.schemePlans[0].id
                resolvedFundName = scheme.name
                resolvedSchemeCode = scheme.schemePlans[0].isin || h.amfiCode
                resolvedCategory = scheme.category?.name || 'Unknown'
                resolvedAssetClass = this.inferAssetClass(resolvedCategory)
              }
            }

            const investedValue = h.costValue || 0
            const currentValue = h.currentValue || 0
            const absoluteGain = currentValue - investedValue
            const absoluteGainPct = investedValue > 0 ? (absoluteGain / investedValue) * 100 : 0

            await this.prisma.fAHolding.create({
              data: {
                clientId: client.id,
                schemePlanId,
                fundName: resolvedFundName,
                fundSchemeCode: resolvedSchemeCode || h.isin || h.amfiCode || 'IMPORTED',
                fundCategory: resolvedCategory,
                assetClass: resolvedAssetClass,
                folioNumber: h.folioNo || 'N/A',
                units: h.units,
                avgNav: investedValue > 0 ? investedValue / h.units : h.nav,
                currentNav: h.nav,
                investedValue,
                currentValue,
                absoluteGain,
                absoluteGainPct,
                lastTxnDate: h.navDate || new Date(),
              },
            })
            importedHoldings++
          } catch (holdingErr) {
            errors.push({
              row: 0,
              field: 'holding',
              message: `Failed to import holding for ${h.schemeName}: ${(holdingErr as Error).message}`,
            })
            skippedRecords++
          }
        }
      } catch (clientErr) {
        errors.push({
          row: 0,
          field: 'client',
          message: `Failed to import client ${panOrName}: ${(clientErr as Error).message}`,
        })
        skippedRecords += holdings.length
      }
    }

    return { importedClients, importedHoldings, skippedRecords, errors }
  }

  // ── MIS record processing ──
  private async processMisRecords(advisorId: string, records: MisRecord[]) {
    const clientMap = new Map<string, MisRecord[]>()
    for (const r of records) {
      const key = r.pan || r.investorName
      const existing = clientMap.get(key) || []
      existing.push(r)
      clientMap.set(key, existing)
    }

    let importedClients = 0
    let importedHoldings = 0
    let skippedRecords = 0
    const errors: { row: number; field: string; message: string }[] = []

    for (const [panOrName, holdings] of clientMap) {
      try {
        const firstRecord = holdings[0]
        const pan = firstRecord.pan

        let client = pan
          ? await this.prisma.fAClient.findFirst({ where: { advisorId, pan } })
          : null

        if (!client) {
          const email = firstRecord.email || `import-${randomUUID().slice(0, 8)}@import.placeholder`

          client = await this.prisma.fAClient.create({
            data: {
              advisorId,
              name: firstRecord.investorName,
              pan: pan || null,
              email,
              phone: firstRecord.mobile || 'N/A',
              kycStatus: 'PENDING',
              tags: ['KFINTECH_MIS_IMPORT'],
            },
          })
          importedClients++
        }

        for (const h of holdings) {
          try {
            let schemePlanId: string | null = null
            let resolvedFundName = h.schemeName
            let resolvedSchemeCode = ''
            let resolvedCategory = 'Unknown'
            let resolvedAssetClass = 'Unknown'

            if (h.isin) {
              const sp = await this.prisma.schemePlan.findFirst({
                where: { isin: h.isin },
                include: { scheme: { include: { category: true } } },
              })
              if (sp) {
                schemePlanId = sp.id
                resolvedFundName = sp.scheme?.name || h.schemeName
                resolvedSchemeCode = sp.isin || h.isin || ''
                resolvedCategory = sp.scheme?.category?.name || 'Unknown'
                resolvedAssetClass = this.inferAssetClass(resolvedCategory)
              }
            }

            const investedValue = h.amount || 0
            const currentValue = h.currentValue || 0
            const absoluteGain = currentValue - investedValue
            const absoluteGainPct = investedValue > 0 ? (absoluteGain / investedValue) * 100 : 0

            await this.prisma.fAHolding.create({
              data: {
                clientId: client.id,
                schemePlanId,
                fundName: resolvedFundName,
                fundSchemeCode: resolvedSchemeCode || h.isin || 'IMPORTED',
                fundCategory: resolvedCategory,
                assetClass: resolvedAssetClass,
                folioNumber: h.folioNo || 'N/A',
                units: h.units,
                avgNav: investedValue > 0 ? investedValue / h.units : 0,
                currentNav: currentValue > 0 ? currentValue / h.units : 0,
                investedValue,
                currentValue,
                absoluteGain,
                absoluteGainPct,
                lastTxnDate: new Date(),
              },
            })
            importedHoldings++
          } catch (holdingErr) {
            errors.push({
              row: 0,
              field: 'holding',
              message: `Failed to import holding for ${h.schemeName}: ${(holdingErr as Error).message}`,
            })
            skippedRecords++
          }
        }
      } catch (clientErr) {
        errors.push({
          row: 0,
          field: 'client',
          message: `Failed to import client ${panOrName}: ${(clientErr as Error).message}`,
        })
        skippedRecords += holdings.length
      }
    }

    return { importedClients, importedHoldings, skippedRecords, errors }
  }

  private inferAssetClass(category: string): string {
    const lower = category.toLowerCase()
    if (lower.includes('equity') || lower.includes('elss')) return 'Equity'
    if (lower.includes('debt') || lower.includes('gilt') || lower.includes('liquid') || lower.includes('money market')) return 'Debt'
    if (lower.includes('hybrid') || lower.includes('balanced') || lower.includes('multi asset')) return 'Hybrid'
    return 'Other'
  }
}
