import { Module } from '@nestjs/common';
import { FundsController } from './funds.controller';
import { MfApiService } from './mfapi.service';

@Module({
  controllers: [FundsController],
  providers: [MfApiService],
  exports: [MfApiService],
})
export class FundsModule {}
