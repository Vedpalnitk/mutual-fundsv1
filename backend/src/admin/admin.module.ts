import { Module } from '@nestjs/common'

// Controllers
import { AdminAuditLogsController } from './controllers/admin-audit-logs.controller'
import { AdminAdvisorsController } from './controllers/admin-advisors.controller'
import { AdminTransactionsController } from './controllers/admin-transactions.controller'
import { AdminAnalyticsController } from './controllers/admin-analytics.controller'
import { AdminExchangeHealthController } from './controllers/admin-exchange-health.controller'
import { AdminSettingsController } from './controllers/admin-settings.controller'
import { AdminExportController } from './controllers/admin-export.controller'

// Services
import { AdminAuditLogsService } from './services/admin-audit-logs.service'
import { AdminAdvisorsService } from './services/admin-advisors.service'
import { AdminTransactionsService } from './services/admin-transactions.service'
import { AdminAnalyticsService } from './services/admin-analytics.service'
import { AdminExchangeHealthService } from './services/admin-exchange-health.service'
import { AdminSettingsService } from './services/admin-settings.service'
import { AdminExportService } from './services/admin-export.service'

@Module({
  controllers: [
    AdminAuditLogsController,
    AdminAdvisorsController,
    AdminTransactionsController,
    AdminAnalyticsController,
    AdminExchangeHealthController,
    AdminSettingsController,
    AdminExportController,
  ],
  providers: [
    AdminAuditLogsService,
    AdminAdvisorsService,
    AdminTransactionsService,
    AdminAnalyticsService,
    AdminExchangeHealthService,
    AdminSettingsService,
    AdminExportService,
  ],
})
export class AdminModule {}
