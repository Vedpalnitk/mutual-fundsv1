import { Module } from '@nestjs/common';
import { InsuranceController } from './insurance.controller';
import { InsuranceService } from './insurance.service';
import { InsuranceReminderService } from './insurance-reminder.service';

@Module({
  controllers: [InsuranceController],
  providers: [InsuranceService, InsuranceReminderService],
  exports: [InsuranceService],
})
export class InsuranceModule {}
