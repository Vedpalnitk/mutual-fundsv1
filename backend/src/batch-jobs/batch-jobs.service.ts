import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { PrismaService } from '../prisma/prisma.service'
import { BATCH_JOBS, BATCH_JOBS_MAP } from './batch-jobs.registry'
import { FundSyncService } from '../funds/fund-sync.service'
import { AmfiTerService } from '../funds/amfi-ter.service'
import { AmfiAumService } from '../funds/amfi-aum.service'
import { ComplianceScheduler } from '../compliance/compliance.scheduler'
import { AumSnapshotScheduler } from '../business-intelligence/aum-snapshot.scheduler'
import { InsuranceReminderService } from '../insurance/insurance-reminder.service'
import { BseSchemeMasterSyncJob } from '../bse-star-mf/jobs/bse-scheme-master-sync.job'
import { NseSchemeMasterSyncJob } from '../nse-nmf/jobs/nse-scheme-master-sync.job'
import { SchemeEnrichmentService } from '../funds/scheme-enrichment.service'
import { AmfiHistoricalService } from '../funds/amfi-historical.service'

@Injectable()
export class BatchJobsService {
  private readonly logger = new Logger(BatchJobsService.name)

  constructor(
    private prisma: PrismaService,
    private moduleRef: ModuleRef,
  ) {}

  async listJobsWithLatestRun() {
    const syncTypes = BATCH_JOBS.map(j => j.id)

    // Get latest run per syncType
    const latestRuns = await this.prisma.$queryRawUnsafe<Array<{
      sync_type: string
      id: number
      status: string
      records_total: number | null
      records_synced: number | null
      records_failed: number | null
      error_message: string | null
      started_at: Date
      completed_at: Date | null
    }>>(
      `SELECT DISTINCT ON (sync_type)
         sync_type, id, status, records_total, records_synced, records_failed,
         error_message, started_at, completed_at
       FROM data_sync_logs
       WHERE sync_type = ANY($1)
       ORDER BY sync_type, started_at DESC`,
      syncTypes,
    )

    const latestRunMap = new Map(latestRuns.map(r => [r.sync_type, r]))

    // Get 24h stats
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentRuns = await this.prisma.dataSyncLog.groupBy({
      by: ['syncType', 'status'],
      where: {
        syncType: { in: syncTypes },
        startedAt: { gte: twentyFourHoursAgo },
      },
      _count: true,
    })

    // Build 24h stats per job
    const stats24h = new Map<string, { total: number; completed: number; failed: number }>()
    for (const r of recentRuns) {
      const existing = stats24h.get(r.syncType) || { total: 0, completed: 0, failed: 0 }
      existing.total += r._count
      if (r.status === 'completed') existing.completed += r._count
      if (r.status === 'failed') existing.failed += r._count
      stats24h.set(r.syncType, existing)
    }

    // Merge registry + DB data
    const jobs = BATCH_JOBS.map(def => {
      const latest = latestRunMap.get(def.id)
      const s = stats24h.get(def.id) || { total: 0, completed: 0, failed: 0 }

      return {
        ...def,
        latestRun: latest
          ? {
              id: latest.id,
              status: latest.status,
              recordsTotal: latest.records_total,
              recordsSynced: latest.records_synced,
              recordsFailed: latest.records_failed,
              errorMessage: latest.error_message,
              startedAt: latest.started_at,
              completedAt: latest.completed_at,
            }
          : null,
        stats24h: s,
      }
    })

    // Global stats
    const totalRuns24h = Array.from(stats24h.values()).reduce((sum, s) => sum + s.total, 0)
    const totalFailed24h = Array.from(stats24h.values()).reduce((sum, s) => sum + s.failed, 0)
    const totalCompleted24h = Array.from(stats24h.values()).reduce((sum, s) => sum + s.completed, 0)
    const successRate = totalRuns24h > 0
      ? Math.round((totalCompleted24h / totalRuns24h) * 100)
      : 100

    return {
      jobs,
      summary: {
        totalJobs: BATCH_JOBS.length,
        totalRuns24h,
        totalFailed24h,
        successRate,
      },
    }
  }

  async getJobRuns(jobId: string, page = 1, limit = 20) {
    if (!BATCH_JOBS_MAP.has(jobId)) {
      throw new NotFoundException(`Job ${jobId} not found`)
    }

    const skip = (page - 1) * limit

    const [runs, total] = await Promise.all([
      this.prisma.dataSyncLog.findMany({
        where: { syncType: jobId },
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.dataSyncLog.count({ where: { syncType: jobId } }),
    ])

    return {
      runs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async triggerJob(jobId: string) {
    const def = BATCH_JOBS_MAP.get(jobId)
    if (!def) {
      throw new NotFoundException(`Job ${jobId} not found`)
    }
    if (!def.manualTrigger) {
      throw new BadRequestException(`Job ${jobId} does not support manual triggering`)
    }

    // Resolve the service and call the trigger method
    try {
      switch (jobId) {
        case 'amfi_nav': {
          const svc = this.moduleRef.get(FundSyncService, { strict: false })
          await svc.syncFromAmfi()
          break
        }
        case 'amfi_ter': {
          const svc = this.moduleRef.get(AmfiTerService, { strict: false })
          await svc.fetchLatestTer()
          break
        }
        case 'amfi_aum': {
          const svc = this.moduleRef.get(AmfiAumService, { strict: false })
          await svc.fetchLatestAum()
          break
        }
        case 'compliance_expiry': {
          const svc = this.moduleRef.get(ComplianceScheduler, { strict: false })
          await svc.checkExpiringRecords()
          break
        }
        case 'aum_snapshot': {
          const svc = this.moduleRef.get(AumSnapshotScheduler, { strict: false })
          await svc.captureDaily()
          break
        }
        case 'insurance_reminders': {
          const svc = this.moduleRef.get(InsuranceReminderService, { strict: false })
          await svc.checkPremiumReminders()
          break
        }
        case 'amfi_nav_backfill': {
          const svc = this.moduleRef.get(AmfiHistoricalService, { strict: false })
          await svc.backfillRecent(90)
          break
        }
        case 'amfi_nav_backfill_full': {
          const svc = this.moduleRef.get(AmfiHistoricalService, { strict: false })
          await svc.backfillFull(5)
          break
        }
        case 'scheme_enrichment': {
          const svc = this.moduleRef.get(SchemeEnrichmentService, { strict: false })
          await svc.enrichAll()
          break
        }
        case 'bse_scheme_master': {
          const svc = this.moduleRef.get(BseSchemeMasterSyncJob, { strict: false })
          await svc.syncSchemeMaster()
          break
        }
        case 'nse_scheme_master': {
          const svc = this.moduleRef.get(NseSchemeMasterSyncJob, { strict: false })
          await svc.syncSchemeMaster()
          break
        }
        default:
          throw new BadRequestException(`No manual trigger handler for ${jobId}`)
      }

      return { message: `Job ${jobId} triggered successfully` }
    } catch (error) {
      this.logger.error(`Manual trigger of ${jobId} failed`, error)
      throw error
    }
  }
}
