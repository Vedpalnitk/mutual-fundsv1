import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PrismaService } from '../../prisma/prisma.service'
import { NseReportsService } from '../reports/nse-reports.service'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class NseSchemeMasterSyncJob {
  private readonly logger = new Logger(NseSchemeMasterSyncJob.name)

  constructor(
    private prisma: PrismaService,
    private reportsService: NseReportsService,
    private config: ConfigService,
  ) {}

  // Run every Sunday at 3am
  @Cron('0 3 * * 0')
  async syncSchemeMaster() {
    this.logger.log('Starting NSE scheme master sync')

    // Find first advisor with active NSE credentials to use for API call
    const credential = await this.prisma.nsePartnerCredential.findFirst({
      where: { isActive: true },
    })

    if (!credential) {
      this.logger.warn('No active NSE credentials found, skipping scheme master sync')
      return
    }

    try {
      const report = await this.reportsService.getReport(
        credential.userId,
        'scheme-master',
        {},
      ) as any

      if (!report?.data || !Array.isArray(report.data)) {
        this.logger.warn('No scheme master data received')
        return
      }

      let upserted = 0
      for (const scheme of report.data) {
        try {
          await this.prisma.nseSchemeMaster.upsert({
            where: { schemeCode: scheme.scheme_code },
            update: {
              isin: scheme.isin,
              amcCode: scheme.amc_code,
              schemeName: scheme.scheme_name,
              schemeType: scheme.scheme_type,
              schemePlan: scheme.scheme_plan,
              schemeOption: scheme.scheme_option,
              purchaseAllowed: scheme.purchase_allowed === 'Y',
              redemptionAllowed: scheme.redemption_allowed === 'Y',
              sipAllowed: scheme.sip_allowed === 'Y',
              stpAllowed: scheme.stp_allowed === 'Y',
              swpAllowed: scheme.swp_allowed === 'Y',
              switchAllowed: scheme.switch_allowed === 'Y',
              minPurchaseAmt: scheme.min_purchase_amt ? parseFloat(scheme.min_purchase_amt) : null,
              maxPurchaseAmt: scheme.max_purchase_amt ? parseFloat(scheme.max_purchase_amt) : null,
              minSipAmt: scheme.min_sip_amt ? parseFloat(scheme.min_sip_amt) : null,
              maxSipAmt: scheme.max_sip_amt ? parseFloat(scheme.max_sip_amt) : null,
              sipDates: scheme.sip_dates,
              sipFrequencies: scheme.sip_frequencies,
              lastSyncedAt: new Date(),
            },
            create: {
              schemeCode: scheme.scheme_code,
              isin: scheme.isin,
              amcCode: scheme.amc_code,
              schemeName: scheme.scheme_name,
              schemeType: scheme.scheme_type,
              schemePlan: scheme.scheme_plan,
              schemeOption: scheme.scheme_option,
              purchaseAllowed: scheme.purchase_allowed === 'Y',
              redemptionAllowed: scheme.redemption_allowed === 'Y',
              sipAllowed: scheme.sip_allowed === 'Y',
              stpAllowed: scheme.stp_allowed === 'Y',
              swpAllowed: scheme.swp_allowed === 'Y',
              switchAllowed: scheme.switch_allowed === 'Y',
              minPurchaseAmt: scheme.min_purchase_amt ? parseFloat(scheme.min_purchase_amt) : null,
              maxPurchaseAmt: scheme.max_purchase_amt ? parseFloat(scheme.max_purchase_amt) : null,
              minSipAmt: scheme.min_sip_amt ? parseFloat(scheme.min_sip_amt) : null,
              maxSipAmt: scheme.max_sip_amt ? parseFloat(scheme.max_sip_amt) : null,
              sipDates: scheme.sip_dates,
              sipFrequencies: scheme.sip_frequencies,
              lastSyncedAt: new Date(),
            },
          })
          upserted++
        } catch (err) {
          this.logger.warn(`Failed to upsert scheme ${scheme.scheme_code}`, err)
        }
      }

      this.logger.log(`NSE scheme master sync complete: ${upserted} schemes upserted`)
    } catch (err) {
      this.logger.error('NSE scheme master sync failed', err)
    }
  }
}
