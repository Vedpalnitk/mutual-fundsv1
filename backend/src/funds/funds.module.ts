import { Module } from '@nestjs/common';
import { FundsController } from './funds.controller';
import { AmfiService } from './amfi.service';
import { MetricsCalculatorService } from './metrics-calculator.service';
import { BackfillService } from './backfill.service';
import { FundSyncService } from './fund-sync.service';
import { MfApiService } from './mfapi.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FundsController],
  providers: [
    AmfiService,
    MetricsCalculatorService,
    BackfillService,
    FundSyncService,
    MfApiService, // Kept for backfill only
  ],
  exports: [FundSyncService, AmfiService, MetricsCalculatorService],
})
export class FundsModule {}
