import { Module } from '@nestjs/common'
import { MlGatewayModule } from '../ml-gateway/ml-gateway.module'
import { AdvisorDashboardController } from './advisor-dashboard.controller'
import { AdvisorDashboardService } from './advisor-dashboard.service'

@Module({
  imports: [MlGatewayModule],
  controllers: [AdvisorDashboardController],
  providers: [AdvisorDashboardService],
  exports: [AdvisorDashboardService],
})
export class AdvisorDashboardModule {}
