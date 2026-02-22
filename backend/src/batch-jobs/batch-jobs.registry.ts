export interface BatchJobDefinition {
  id: string
  name: string
  group: 'fund_sync' | 'compliance' | 'aum' | 'insurance' | 'bse' | 'nse'
  schedule: string
  cronExpression: string
  manualTrigger: boolean
}

export const BATCH_JOBS: BatchJobDefinition[] = [
  // Fund Sync
  {
    id: 'amfi_nav',
    name: 'AMFI NAV Sync',
    group: 'fund_sync',
    schedule: 'Mon-Fri 00:30 IST',
    cronExpression: '0 30 0 * * 1-5',
    manualTrigger: true,
  },
  {
    id: 'amfi_ter',
    name: 'AMFI TER Sync',
    group: 'fund_sync',
    schedule: 'Monthly (1st)',
    cronExpression: '0 4 1 * *',
    manualTrigger: true,
  },
  {
    id: 'amfi_aum',
    name: 'AMFI AUM Sync',
    group: 'fund_sync',
    schedule: 'Quarterly',
    cronExpression: '0 5 15 1,4,7,10 *',
    manualTrigger: true,
  },

  {
    id: 'amfi_nav_backfill',
    name: 'AMFI NAV History Backfill (90d)',
    group: 'fund_sync',
    schedule: 'Manual only',
    cronExpression: '',
    manualTrigger: true,
  },
  {
    id: 'amfi_nav_backfill_full',
    name: 'AMFI NAV Full Backfill (5yr)',
    group: 'fund_sync',
    schedule: 'Manual only',
    cronExpression: '',
    manualTrigger: true,
  },
  {
    id: 'scheme_enrichment',
    name: 'Scheme Metadata Enrichment',
    group: 'fund_sync',
    schedule: 'Sunday 04:00',
    cronExpression: '0 4 * * 0',
    manualTrigger: true,
  },

  // Compliance
  {
    id: 'compliance_expiry',
    name: 'Compliance Expiry Check',
    group: 'compliance',
    schedule: 'Daily 06:00 IST',
    cronExpression: '30 0 * * *',
    manualTrigger: true,
  },

  // AUM
  {
    id: 'aum_snapshot',
    name: 'AUM Snapshot Capture',
    group: 'aum',
    schedule: 'Daily 23:00 IST',
    cronExpression: '30 17 * * *',
    manualTrigger: true,
  },

  // Insurance
  {
    id: 'insurance_reminders',
    name: 'Insurance Premium Reminders',
    group: 'insurance',
    schedule: 'Daily 09:00 IST',
    cronExpression: '0 0 9 * * *',
    manualTrigger: true,
  },

  // BSE
  {
    id: 'bse_token_refresh',
    name: 'BSE Token Refresh',
    group: 'bse',
    schedule: 'Every 5 minutes',
    cronExpression: '*/5 * * * *',
    manualTrigger: false,
  },
  {
    id: 'bse_token_cleanup',
    name: 'BSE Token Cleanup',
    group: 'bse',
    schedule: 'Daily midnight',
    cronExpression: '0 0 * * *',
    manualTrigger: false,
  },
  {
    id: 'bse_mandate_poll',
    name: 'BSE Mandate Status Poll',
    group: 'bse',
    schedule: 'Every 30 minutes',
    cronExpression: '*/30 * * * *',
    manualTrigger: false,
  },
  {
    id: 'bse_order_poll',
    name: 'BSE Order Status Poll',
    group: 'bse',
    schedule: 'Every 15 minutes',
    cronExpression: '*/15 * * * *',
    manualTrigger: false,
  },
  {
    id: 'bse_allotment_sync',
    name: 'BSE Allotment Reconciliation',
    group: 'bse',
    schedule: 'Weekdays 21:00',
    cronExpression: '0 21 * * 1-5',
    manualTrigger: false,
  },
  {
    id: 'bse_scheme_master',
    name: 'BSE Scheme Master Sync',
    group: 'bse',
    schedule: 'Sunday 02:00',
    cronExpression: '0 2 * * 0',
    manualTrigger: true,
  },

  // NSE
  {
    id: 'nse_mandate_poll',
    name: 'NSE Mandate Status Poll',
    group: 'nse',
    schedule: 'Every 30 minutes',
    cronExpression: '*/30 * * * *',
    manualTrigger: false,
  },
  {
    id: 'nse_order_poll',
    name: 'NSE Order Status Poll',
    group: 'nse',
    schedule: 'Every 10 minutes',
    cronExpression: '*/10 * * * *',
    manualTrigger: false,
  },
  {
    id: 'nse_scheme_master',
    name: 'NSE Scheme Master Sync',
    group: 'nse',
    schedule: 'Sunday 03:00',
    cronExpression: '0 3 * * 0',
    manualTrigger: true,
  },
]

export const BATCH_JOBS_MAP = new Map(BATCH_JOBS.map(j => [j.id, j]))
