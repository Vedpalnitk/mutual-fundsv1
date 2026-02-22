import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { BseMockService } from '../mocks/bse-mock.service'
import { ConfigService } from '@nestjs/config'
import { Prisma } from '@prisma/client'
import { CacheService } from '../../common/services/cache.service'

@Injectable()
export class BseMastersService {
  private readonly logger = new Logger(BseMastersService.name)
  private readonly isMockMode: boolean

  constructor(
    private prisma: PrismaService,
    private mockService: BseMockService,
    private config: ConfigService,
    private cacheService: CacheService,
  ) {
    this.isMockMode = this.config.get<boolean>('bse.mockMode') === true
  }

  async searchSchemes(query: string, page = 1, limit = 20) {
    const cacheKey = `schemes:bse:${query}:${page}:${limit}`
    return this.cacheService.wrap(cacheKey, () => this._searchSchemes(query, page, limit), 3600 * 1000)
  }

  private async _searchSchemes(query: string, page = 1, limit = 20) {
    const where: Prisma.BseSchemeMasterWhereInput = query
      ? {
          OR: [
            { schemeName: { contains: query, mode: 'insensitive' } },
            { schemeCode: { contains: query, mode: 'insensitive' } },
            { isin: { contains: query, mode: 'insensitive' } },
          ],
        }
      : {}

    const [total, schemes] = await Promise.all([
      this.prisma.bseSchemeMaster.count({ where }),
      this.prisma.bseSchemeMaster.findMany({
        where,
        orderBy: { schemeName: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return {
      data: schemes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async syncSchemeMaster(advisorId: string) {
    if (this.isMockMode) {
      const mockData = this.mockService.mockSchemeMasterData()

      for (const scheme of mockData) {
        await this.prisma.bseSchemeMaster.upsert({
          where: { schemeCode: scheme.SchemeCode },
          update: {
            schemeName: scheme.SchemeName,
            isin: scheme.ISIN,
            amcCode: scheme.AMCCode,
            purchaseAllowed: scheme.PurchaseAllowed === 'Y',
            redemptionAllowed: scheme.RedemptionAllowed === 'Y',
            sipAllowed: scheme.SIPAllowed === 'Y',
            minPurchaseAmt: scheme.MinPurchaseAmt ? parseFloat(scheme.MinPurchaseAmt) : null,
            minSipAmt: scheme.MinSIPAmt ? parseFloat(scheme.MinSIPAmt) : null,
            lastSyncedAt: new Date(),
          },
          create: {
            schemeCode: scheme.SchemeCode,
            schemeName: scheme.SchemeName,
            isin: scheme.ISIN,
            amcCode: scheme.AMCCode,
            purchaseAllowed: scheme.PurchaseAllowed === 'Y',
            redemptionAllowed: scheme.RedemptionAllowed === 'Y',
            sipAllowed: scheme.SIPAllowed === 'Y',
            minPurchaseAmt: scheme.MinPurchaseAmt ? parseFloat(scheme.MinPurchaseAmt) : null,
            minSipAmt: scheme.MinSIPAmt ? parseFloat(scheme.MinSIPAmt) : null,
            lastSyncedAt: new Date(),
          },
        })
      }

      return { success: true, synced: mockData.length, message: 'Scheme master synced (mock)' }
    }

    // In real mode, BSE provides scheme master as a downloadable CSV/API
    // This would be implemented with actual BSE scheme master API
    return { success: true, synced: 0, message: 'Sync not available without BSE credentials' }
  }

  async listBanks(paymentMode?: string) {
    const where: Prisma.BseBankMasterWhereInput = { isActive: true }

    if (paymentMode === 'DIRECT') where.directAllowed = true
    else if (paymentMode === 'NODAL') where.nodalAllowed = true
    else if (paymentMode === 'NEFT') where.neftAllowed = true
    else if (paymentMode === 'UPI') where.upiAllowed = true

    return this.prisma.bseBankMaster.findMany({
      where,
      orderBy: { bankName: 'asc' },
    })
  }

  async getTaxStatusCodes() {
    const { BSE_TAX_STATUS_CODES } = await import('../core/constants/tax-status.js')
    return Object.entries(BSE_TAX_STATUS_CODES).map(([code, label]) => ({
      code,
      label,
    }))
  }
}
