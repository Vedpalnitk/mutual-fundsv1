import { Module } from '@nestjs/common';
import { SavedAnalysisController } from './saved-analysis.controller';
import { SavedAnalysisService } from './saved-analysis.service';

@Module({
  controllers: [SavedAnalysisController],
  providers: [SavedAnalysisService],
  exports: [SavedAnalysisService],
})
export class SavedAnalysisModule {}
