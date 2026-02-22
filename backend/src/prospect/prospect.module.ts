import { Module } from '@nestjs/common'
import { ProspectController } from './prospect.controller'
import { ProspectService } from './prospect.service'

@Module({
  controllers: [ProspectController],
  providers: [ProspectService],
  exports: [ProspectService],
})
export class ProspectModule {}
