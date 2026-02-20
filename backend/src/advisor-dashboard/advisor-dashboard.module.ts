import { Module } from '@nestjs/common'
import { MlGatewayModule } from '../ml-gateway/ml-gateway.module'
import { BseStarMfModule } from '../bse-star-mf/bse-star-mf.module'
import { NseNmfModule } from '../nse-nmf/nse-nmf.module'
import { AdvisorDashboardController } from './advisor-dashboard.controller'
import { AdvisorDashboardService } from './advisor-dashboard.service'

@Module({
  imports: [MlGatewayModule, BseStarMfModule, NseNmfModule],
  controllers: [AdvisorDashboardController],
  providers: [AdvisorDashboardService],
  exports: [AdvisorDashboardService],
})
export class AdvisorDashboardModule {}
