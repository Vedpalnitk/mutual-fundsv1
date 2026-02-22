import { Module } from '@nestjs/common'
import { BulkImportController } from './bulk-import.controller'
import { BulkImportService } from './bulk-import.service'
import { CamsWbrParser } from './parsers/cams-wbr.parser'
import { KfintechMisParser } from './parsers/kfintech-mis.parser'

@Module({
  controllers: [BulkImportController],
  providers: [BulkImportService, CamsWbrParser, KfintechMisParser],
  exports: [BulkImportService],
})
export class BulkImportModule {}
