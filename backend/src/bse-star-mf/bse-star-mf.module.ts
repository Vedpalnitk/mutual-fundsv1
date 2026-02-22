import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'

// Core Infrastructure
import { BseHttpClient } from './core/bse-http.client'
import { BseSoapBuilder } from './core/bse-soap.builder'
import { BseSessionManager } from './core/bse-session.manager'
import { BseCryptoService } from './core/bse-crypto.service'
import { BseErrorMapper } from './core/bse-error.mapper'
import { BseReferenceNumberService } from './core/bse-reference-number.service'

// Auth
import { BseAuthService } from './auth/bse-auth.service'

// Credentials
import { BseCredentialsService } from './credentials/bse-credentials.service'
import { BseCredentialsController } from './credentials/bse-credentials.controller'

// Mocks
import { BseMockService } from './mocks/bse-mock.service'
import { BseMockInterceptor } from './mocks/bse-mock.interceptor'

// Client Registration
import { BseUccService } from './client-registration/bse-ucc.service'
import { BseFatcaService } from './client-registration/bse-fatca.service'
import { BseCkycService } from './client-registration/bse-ckyc.service'
import { BseClientRegistrationController } from './client-registration/bse-client-registration.controller'

// Mandates
import { BseMandateService } from './mandates/bse-mandate.service'
import { BseMandatesController } from './mandates/bse-mandates.controller'

// Orders
import { BseOrderService } from './orders/bse-order.service'
import { BseOrderProcessor } from './orders/bse-order.processor'
import { BseSwitchService } from './orders/bse-switch.service'
import { BseSpreadService } from './orders/bse-spread.service'
import { BseCobService } from './orders/bse-cob.service'
import { BseOrdersController } from './orders/bse-orders.controller'

// Payments
import { BsePaymentService } from './payments/bse-payment.service'
import { BsePaymentsController } from './payments/bse-payments.controller'

// Systematic Plans
import { BseSipService } from './systematic/bse-sip.service'
import { BseXsipService } from './systematic/bse-xsip.service'
import { BseStpService } from './systematic/bse-stp.service'
import { BseSwpService } from './systematic/bse-swp.service'
import { BseSystematicController } from './systematic/bse-systematic.controller'

// Reports
import { BseReportsService } from './reports/bse-reports.service'
import { BseChildOrdersService } from './reports/bse-child-orders.service'
import { BseReportsController } from './reports/bse-reports.controller'

// Uploads
import { BseUploadService } from './uploads/bse-upload.service'
import { BseUploadsController } from './uploads/bse-uploads.controller'

// Masters
import { BseMastersService } from './masters/bse-masters.service'
import { BseMastersController } from './masters/bse-masters.controller'

// Background Jobs
import { BseSessionRefreshJob } from './jobs/bse-session-refresh.job'
import { BseMandateStatusPollJob } from './jobs/bse-mandate-status-poll.job'
import { BseOrderStatusPollJob } from './jobs/bse-order-status-poll.job'
import { BseAllotmentSyncJob } from './jobs/bse-allotment-sync.job'
import { BseSchemeMasterSyncJob } from './jobs/bse-scheme-master-sync.job'

@Module({
  imports: [PrismaModule],
  controllers: [
    BseCredentialsController,
    BseClientRegistrationController,
    BseMandatesController,
    BseOrdersController,
    BsePaymentsController,
    BseSystematicController,
    BseReportsController,
    BseUploadsController,
    BseMastersController,
  ],
  providers: [
    // Core
    BseHttpClient,
    BseSoapBuilder,
    BseSessionManager,
    BseCryptoService,
    BseErrorMapper,
    BseReferenceNumberService,

    // Auth
    BseAuthService,

    // Credentials
    BseCredentialsService,

    // Mocks
    BseMockService,
    BseMockInterceptor,

    // Client Registration
    BseUccService,
    BseFatcaService,
    BseCkycService,

    // Mandates
    BseMandateService,

    // Orders
    BseOrderService,
    BseOrderProcessor,
    BseSwitchService,
    BseSpreadService,
    BseCobService,

    // Payments
    BsePaymentService,

    // Systematic
    BseSipService,
    BseXsipService,
    BseStpService,
    BseSwpService,

    // Reports
    BseReportsService,
    BseChildOrdersService,

    // Uploads
    BseUploadService,

    // Masters
    BseMastersService,

    // Background Jobs
    BseSessionRefreshJob,
    BseMandateStatusPollJob,
    BseOrderStatusPollJob,
    BseAllotmentSyncJob,
    BseSchemeMasterSyncJob,
  ],
  exports: [
    BseAuthService,
    BseCredentialsService,
    BseOrderService,
    BseSwitchService,
    BseCobService,
    BseSipService,
    BseXsipService,
    BsePaymentService,
    BseMastersService,
  ],
})
export class BseStarMfModule {}
