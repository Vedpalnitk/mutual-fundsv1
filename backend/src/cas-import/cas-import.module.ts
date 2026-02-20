import { Module } from '@nestjs/common';
import { CasImportController } from './cas-import.controller';
import { CasImportService } from './cas-import.service';

@Module({
  controllers: [CasImportController],
  providers: [CasImportService],
  exports: [CasImportService],
})
export class CasImportModule {}
