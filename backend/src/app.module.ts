import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
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
  ],
  controllers: [],
  providers: [
    // Global JWT guard - all routes require auth by default
    // Use @Public() decorator to make routes public
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
