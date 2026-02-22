import { Module } from '@nestjs/common'
import { EuinCommissionController } from './euin-commission.controller'
import { EuinCommissionService } from './euin-commission.service'

@Module({
  controllers: [EuinCommissionController],
  providers: [EuinCommissionService],
  exports: [EuinCommissionService],
})
export class EuinCommissionModule {}
