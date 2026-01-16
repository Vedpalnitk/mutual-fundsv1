import { Module } from '@nestjs/common';
import { MlModelsController } from './ml-models.controller';
import { MlModelsService } from './ml-models.service';

@Module({
  controllers: [MlModelsController],
  providers: [MlModelsService],
  exports: [MlModelsService],
})
export class MlModelsModule {}
