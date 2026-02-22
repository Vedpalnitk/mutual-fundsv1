import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { Prisma } from '@prisma/client'

const AMFI_BASE_URL = 'https://www.amfiindia.com/api'

@Injectable()
export class AmfiHistoricalService {
  private readonly logger = new Logger(AmfiHistoricalService.name)
  private isRunning = false

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Backfill recent daily NAV history from AMFI for all scheme plans.
   * Inserts all daily records (no downsampling) with skipDuplicates.
   */
  async backfillRecent(days = 90): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('AMFI backfill already in progress')
      return
    }

    this.isRunning = true
    const syncLog = await this.prisma.dataSyncLog.create({
      data: { syncType: 'amfi_nav_backfill', status: 'started' },
    })

    try {
      const toDate = new Date()
      const fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - days)

      const fromStr = this.formatDate(fromDate)
      const toStr = this.formatDate(toDate)

      this.logger.log(`Starting AMFI recent backfill: ${fromStr} to ${toStr} (${days} days)`)

      // Load all scheme plans grouped by provider
      const providers = await this.prisma.provider.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          schemes: {
            select: {
              schemePlans: {
                where: { mfapiSchemeCode: { not: null } },
                select: { id: true, mfapiSchemeCode: true },
              },
            },
          },
        },
      })

      let totalSchemes = 0
      let totalRecords = 0
      let totalFailed = 0

      for (const provider of providers) {
        const plans = provider.schemes.flatMap(s => s.schemePlans)
        if (plans.length === 0) continue

        let providerRecords = 0
        let providerFailed = 0

        for (const plan of plans) {
          try {
            const records = await this.fetchSchemeHistory(plan.mfapiSchemeCode!, fromStr, toStr)
            if (records.length === 0) continue

            const data = records.map(r => ({
              schemePlanId: plan.id,
              navDate: new Date(r.date + 'T00:00:00.000Z'),
              nav: new Prisma.Decimal(r.nav),
            }))

            const result = await this.prisma.schemePlanNavHistory.createMany({
              data,
              skipDuplicates: true,
            })

            providerRecords += result.count
          } catch (err) {
            providerFailed++
            this.logger.warn(`Failed to fetch NAV for scheme ${plan.mfapiSchemeCode}: ${err.message}`)
          }

          await this.delay(200)
        }

        totalSchemes += plans.length
        totalRecords += providerRecords
        totalFailed += providerFailed

        this.logger.log(
          `${provider.name}: ${plans.length} schemes, ${providerRecords} NAV records inserted, ${providerFailed} failed`,
        )
      }

      await this.prisma.dataSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'completed',
          recordsTotal: totalSchemes,
          recordsSynced: totalRecords,
          recordsFailed: totalFailed,
          completedAt: new Date(),
        },
      })

      this.logger.log(`AMFI recent backfill complete: ${totalSchemes} schemes, ${totalRecords} NAV records inserted, ${totalFailed} failed`)
    } catch (error) {
      await this.prisma.dataSyncLog.update({
        where: { id: syncLog.id },
        data: { status: 'failed', errorMessage: error.message, completedAt: new Date() },
      })
      this.logger.error('AMFI recent backfill failed', error)
      throw error
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Full 5-year backfill with tiered downsampling:
   * - Daily data for the most recent 3 months
   * - Month-end data only for 3 months to `years` years back
   * Total: ~120 records per plan
   */
  async backfillFull(years = 5): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('AMFI backfill already in progress')
      return
    }

    this.isRunning = true
    const syncLog = await this.prisma.dataSyncLog.create({
      data: { syncType: 'amfi_nav_backfill_full', status: 'started' },
    })

    try {
      const toDate = new Date()
      const fromDate = new Date()
      // AMFI API rejects ranges >= 5 years, so cap at 4yr 11mo
      const effectiveMonths = Math.min(years * 12, 59)
      fromDate.setMonth(fromDate.getMonth() - effectiveMonths)

      const fromStr = this.formatDate(fromDate)
      const toStr = this.formatDate(toDate)

      const now = new Date()
      const threeMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, now.getUTCDate()))

      this.logger.log(`Starting AMFI full backfill: ${fromStr} to ${toStr} (${effectiveMonths} months, tiered downsampling)`)

      // Load all scheme plans grouped by provider
      const providers = await this.prisma.provider.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          schemes: {
            select: {
              schemePlans: {
                where: { mfapiSchemeCode: { not: null } },
                select: { id: true, mfapiSchemeCode: true },
              },
            },
          },
        },
      })

      let totalSchemes = 0
      let totalRecords = 0
      let totalFailed = 0

      for (const provider of providers) {
        const plans = provider.schemes.flatMap(s => s.schemePlans)
        if (plans.length === 0) continue

        let providerRecords = 0
        let providerFailed = 0

        for (const plan of plans) {
          try {
            const records = await this.fetchSchemeHistory(plan.mfapiSchemeCode!, fromStr, toStr)
            if (records.length === 0) continue

            // Parse all records into date/nav pairs
            const allPoints: { date: Date; nav: string }[] = records.map(r => ({
              date: new Date(r.date + 'T00:00:00.000Z'),
              nav: r.nav,
            }))

            // Tier 1: Keep ALL daily data points within last 3 months
            const recentPoints = allPoints.filter(p => p.date >= threeMonthsAgo)

            // Tier 2: For older data (3mo–Nyr), keep only month-end data points
            const olderPoints = allPoints.filter(p => p.date < threeMonthsAgo)
            const monthEndPoints = this.extractMonthEndPoints(olderPoints)

            // Combine
            const combined = [...recentPoints, ...monthEndPoints]

            const data = combined.map(p => ({
              schemePlanId: plan.id,
              navDate: p.date,
              nav: new Prisma.Decimal(p.nav),
            }))

            if (data.length === 0) continue

            const result = await this.prisma.schemePlanNavHistory.createMany({
              data,
              skipDuplicates: true,
            })

            providerRecords += result.count
          } catch (err) {
            providerFailed++
            this.logger.warn(`Failed to fetch full NAV for scheme ${plan.mfapiSchemeCode}: ${err.message}`)
          }

          await this.delay(200)
        }

        totalSchemes += plans.length
        totalRecords += providerRecords
        totalFailed += providerFailed

        this.logger.log(
          `${provider.name}: ${plans.length} schemes, ${providerRecords} NAV records inserted, ${providerFailed} failed`,
        )
      }

      await this.prisma.dataSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'completed',
          recordsTotal: totalSchemes,
          recordsSynced: totalRecords,
          recordsFailed: totalFailed,
          completedAt: new Date(),
        },
      })

      this.logger.log(`AMFI full backfill complete: ${totalSchemes} schemes, ${totalRecords} NAV records inserted, ${totalFailed} failed`)
    } catch (error) {
      await this.prisma.dataSyncLog.update({
        where: { id: syncLog.id },
        data: { status: 'failed', errorMessage: error.message, completedAt: new Date() },
      })
      this.logger.error('AMFI full backfill failed', error)
      throw error
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Fetch historical NAV records for a single scheme from AMFI.
   * Returns array of { date: 'YYYY-MM-DD', nav: '123.4567' }.
   */
  private async fetchSchemeHistory(
    schemeCode: number,
    fromDate: string,
    toDate: string,
  ): Promise<Array<{ date: string; nav: string }>> {
    const url = `${AMFI_BASE_URL}/nav-history?query_type=historical_period&from_date=${fromDate}&to_date=${toDate}&sd_id=${schemeCode}`
    const response = await fetch(url)
    if (!response.ok) return []

    const json = await response.json()
    const navGroups = json?.data?.nav_groups
    if (!Array.isArray(navGroups)) return []

    const records: Array<{ date: string; nav: string }> = []
    for (const group of navGroups) {
      const historicalRecords = group?.historical_records
      if (!Array.isArray(historicalRecords)) continue

      for (const record of historicalRecords) {
        if (record?.date && record?.nav) {
          records.push({ date: record.date, nav: record.nav })
        }
      }
    }

    return records
  }

  /**
   * From a list of NAV data points, extract only the last available data point per calendar month.
   * Keeps the latest date within each month.
   */
  private extractMonthEndPoints(points: { date: Date; nav: string }[]): { date: Date; nav: string }[] {
    const monthMap = new Map<string, { date: Date; nav: string }>()

    for (const point of points) {
      const key = `${point.date.getFullYear()}-${String(point.date.getMonth() + 1).padStart(2, '0')}`
      const existing = monthMap.get(key)
      // Keep the latest date within the month
      if (!existing || point.date > existing.date) {
        monthMap.set(key, point)
      }
    }

    return Array.from(monthMap.values())
  }

  /** Format a Date as YYYY-MM-DD */
  private formatDate(d: Date): string {
    return d.toISOString().split('T')[0]
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
