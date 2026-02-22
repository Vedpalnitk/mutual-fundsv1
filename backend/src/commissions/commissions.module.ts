import { Module } from '@nestjs/common';
import { CommissionsController } from './commissions.controller';
import { CommissionsService } from './commissions.service';
import { CommissionsParser } from './commissions.parser';
import { EuinCommissionModule } from '../euin-commission/euin-commission.module';

@Module({
  imports: [EuinCommissionModule],
  controllers: [CommissionsController],
  providers: [CommissionsService, CommissionsParser],
  exports: [CommissionsService],
})
export class CommissionsModule {}
