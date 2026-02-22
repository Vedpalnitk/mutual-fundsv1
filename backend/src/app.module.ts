import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { ClsModule } from 'nestjs-cls';
import { LoggerModule } from 'nestjs-pino';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PersonasModule } from './personas/personas.module';
import { AllocationsModule } from './allocations/allocations.module';
import { MlModelsModule } from './ml-models/ml-models.module';
import { MlGatewayModule } from './ml-gateway/ml-gateway.module';
import { FundsModule } from './funds/funds.module';
import { ClientsModule } from './clients/clients.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { TransactionsModule } from './transactions/transactions.module';
import { SipsModule } from './sips/sips.module';
import { UsersModule } from './users/users.module';
import { GoalsModule } from './goals/goals.module';
import { MarketModule } from './market/market.module';
import { PointsModule } from './points/points.module';
import { TaxesModule } from './taxes/taxes.module';
import { ActionsModule } from './actions/actions.module';
import { AdvisorsModule } from './advisors/advisors.module';
import { ChatModule } from './chat/chat.module';
import { PortfolioAnalysisModule } from './portfolio-analysis/portfolio-analysis.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdvisorDashboardModule } from './advisor-dashboard/advisor-dashboard.module';
import { SavedAnalysisModule } from './saved-analysis/saved-analysis.module';
import { CommunicationsModule } from './communications/communications.module';
import { StaffModule } from './staff/staff.module';
import { InsuranceModule } from './insurance/insurance.module';
import { StorageModule } from './storage/storage.module';
import { AuditModule } from './audit/audit.module';
import { BranchesModule } from './branches/branches.module';
import { CRMModule } from './crm/crm.module';
import { ProspectModule } from './prospect/prospect.module';
import { CommissionsModule } from './commissions/commissions.module';
import { BusinessIntelligenceModule } from './business-intelligence/business-intelligence.module';
import { ComplianceModule } from './compliance/compliance.module';
import { BseStarMfModule } from './bse-star-mf/bse-star-mf.module';
import { NseNmfModule } from './nse-nmf/nse-nmf.module';
import { CasImportModule } from './cas-import/cas-import.module';
import { MarketingModule } from './marketing/marketing.module';
import { BatchJobsModule } from './batch-jobs/batch-jobs.module';
import { AdminModule } from './admin/admin.module';
import { OrganizationModule } from './organization/organization.module';
import { EuinCommissionModule } from './euin-commission/euin-commission.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { BulkImportModule } from './bulk-import/bulk-import.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { CommonModule } from './common/common.module';
import { QueueModule } from './common/queue/queue.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        BSE_ENCRYPTION_KEY: Joi.when('NODE_ENV', {
          is: 'production',
          then: Joi.string().min(44).required(),
          otherwise: Joi.string().optional().allow(''),
        }),
        NMF_ENCRYPTION_KEY: Joi.when('NODE_ENV', {
          is: 'production',
          then: Joi.string().min(44).required(),
          otherwise: Joi.string().optional().allow(''),
        }),
        PAN_ENCRYPTION_KEY: Joi.when('NODE_ENV', {
          is: 'production',
          then: Joi.string().min(44).required(),
          otherwise: Joi.string().optional().allow(''),
        }),
        BSE_CALLBACK_SECRET: Joi.when('NODE_ENV', {
          is: 'production',
          then: Joi.string().min(32).required(),
          otherwise: Joi.string().optional().allow(''),
        }),
        NMF_CALLBACK_SECRET: Joi.when('NODE_ENV', {
          is: 'production',
          then: Joi.string().min(32).required(),
          otherwise: Joi.string().optional().allow(''),
        }),
      }),
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get('nodeEnv') === 'production' ? 'info' : 'debug',
          transport: config.get('nodeEnv') !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
            : undefined,
          autoLogging: config.get('nodeEnv') === 'production',
          quietReqLogger: true,
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [{
          ttl: 60000,
          limit: config.get('nodeEnv') === 'production' ? 100 : 1000,
        }],
        storage: new ThrottlerStorageRedisService(
          `redis://${config.get('redis.host') || 'localhost'}:${config.get('redis.port') || 6379}`,
        ),
      }),
    }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    ScheduleModule.forRoot(),
    CommonModule,
    QueueModule,
    HealthModule,
    PrismaModule,
    AuthModule,
    PersonasModule,
    AllocationsModule,
    MlModelsModule,
    MlGatewayModule,
    FundsModule,
    // FA Portal Modules
    ClientsModule,
    PortfolioModule,
    TransactionsModule,
    SipsModule,
    // Admin Modules
    UsersModule,
    // User Features
    GoalsModule,
    MarketModule,
    PointsModule,
    TaxesModule,
    ActionsModule,
    AdvisorsModule,
    // AI Chat
    ChatModule,
    // Portfolio Analysis (calls Python service)
    PortfolioAnalysisModule,
    // Notifications (Email, WhatsApp, Push)
    NotificationsModule,
    // Advisor Dashboard (aggregated KPIs, insights)
    AdvisorDashboardModule,
    // Saved Deep Analysis (save, version, edit, PDF)
    SavedAnalysisModule,
    // FA Communications (email/WhatsApp sharing)
    CommunicationsModule,
    // FA Staff Role Management
    StaffModule,
    // FA Insurance Policy Tracking
    InsuranceModule,
    // Object Storage (MinIO)
    StorageModule,
    // Business Management - Audit Trail (global)
    AuditModule,
    // Business Management - Branch Management
    BranchesModule,
    // Business Management - CRM
    CRMModule,
    ProspectModule,
    // Business Management - Commission Tracking
    CommissionsModule,
    // Business Management - BI & Revenue Analytics
    BusinessIntelligenceModule,
    // Business Management - Compliance Tracking
    ComplianceModule,
    // BSE StAR MF Integration
    BseStarMfModule,
    // NSE NMF (MFSS) Integration
    NseNmfModule,
    // CAS PDF Import (CAMS/KFintech portfolio ingestion)
    CasImportModule,
    // Marketing (branded image generation)
    MarketingModule,
    // Admin Batch Jobs Monitoring
    BatchJobsModule,
    // Admin Portal — Oversight, Analytics, Export
    AdminModule,
    // Organization — Multi-ARN Support
    OrganizationModule,
    // EUIN Commission — Split Sharing & Payouts
    EuinCommissionModule,
    // Advisor Onboarding Wizard
    OnboardingModule,
    // Bulk Import (CAMS WBR / KFintech MIS)
    BulkImportModule,
  ],
  controllers: [],
  providers: [
    // Global JWT guard - all routes require auth by default
    // Use @Public() decorator to make routes public
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global rate limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
