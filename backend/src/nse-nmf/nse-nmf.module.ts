import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'

// Core Infrastructure
import { NseHttpClient } from './core/nse-http.client'
import { NseAuthBuilder } from './core/nse-auth.builder'
import { NseCryptoService } from './core/nse-crypto.service'
import { NseErrorMapper } from './core/nse-error.mapper'

// Credentials
import { NseCredentialsService } from './credentials/nse-credentials.service'
import { NseCredentialsController } from './credentials/nse-credentials.controller'

// Mocks
import { NseMockService } from './mocks/nse-mock.service'

// Client Registration
import { NseUccService } from './client-registration/nse-ucc.service'
import { NseFatcaService } from './client-registration/nse-fatca.service'
import { NseEkycService } from './client-registration/nse-ekyc.service'
import { NseClientRegistrationController } from './client-registration/nse-client-registration.controller'

// Mandates
import { NseMandateService } from './mandates/nse-mandate.service'
import { NseMandatesController } from './mandates/nse-mandates.controller'

// Orders
import { NseOrderService } from './orders/nse-order.service'
import { NseSwitchService } from './orders/nse-switch.service'
import { NseOrdersController } from './orders/nse-orders.controller'

// Payments
import { NsePaymentService } from './payments/nse-payment.service'
import { NsePaymentsController } from './payments/nse-payments.controller'

// Systematic Plans
import { NseSipService } from './systematic/nse-sip.service'
import { NseXsipService } from './systematic/nse-xsip.service'
import { NseStpService } from './systematic/nse-stp.service'
import { NseSwpService } from './systematic/nse-swp.service'
import { NsePauseService } from './systematic/nse-pause.service'
import { NseSystematicController } from './systematic/nse-systematic.controller'

// Cancellation
import { NseCancellationService } from './cancellation/nse-cancellation.service'

// Reports
import { NseReportsService } from './reports/nse-reports.service'
import { NseReportsController } from './reports/nse-reports.controller'

// Uploads
import { NseUploadService } from './uploads/nse-upload.service'
import { NseUploadsController } from './uploads/nse-uploads.controller'

// Utilities
import { NseUtilitiesService } from './utilities/nse-utilities.service'
import { NseUtilitiesController } from './utilities/nse-utilities.controller'

// Background Jobs
import { NseMandateStatusPollJob } from './jobs/nse-mandate-status-poll.job'
import { NseOrderStatusPollJob } from './jobs/nse-order-status-poll.job'
import { NseSchemeMasterSyncJob } from './jobs/nse-scheme-master-sync.job'

@Module({
  imports: [PrismaModule],
  controllers: [
    NseCredentialsController,
    NseClientRegistrationController,
    NseMandatesController,
    NseOrdersController,
    NsePaymentsController,
    NseSystematicController,
    NseReportsController,
    NseUploadsController,
    NseUtilitiesController,
  ],
  providers: [
    // Core
    NseHttpClient,
    NseAuthBuilder,
    NseCryptoService,
    NseErrorMapper,

    // Credentials
    NseCredentialsService,

    // Mocks
    NseMockService,

    // Client Registration
    NseUccService,
    NseFatcaService,
    NseEkycService,

    // Mandates
    NseMandateService,

    // Orders
    NseOrderService,
    NseSwitchService,

    // Payments
    NsePaymentService,

    // Systematic
    NseSipService,
    NseXsipService,
    NseStpService,
    NseSwpService,
    NsePauseService,

    // Cancellation
    NseCancellationService,

    // Reports
    NseReportsService,

    // Uploads
    NseUploadService,

    // Utilities
    NseUtilitiesService,

    // Background Jobs
    NseMandateStatusPollJob,
    NseOrderStatusPollJob,
    NseSchemeMasterSyncJob,
  ],
  exports: [
    NseCredentialsService,
    NseOrderService,
    NseSipService,
    NseXsipService,
    NsePaymentService,
  ],
})
export class NseNmfModule {}
