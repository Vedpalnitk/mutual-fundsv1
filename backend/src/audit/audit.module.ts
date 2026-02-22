import { Global, Module } from '@nestjs/common'
import { AuditLogService } from '../common/services/audit-log.service'

@Global()
@Module({
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditModule {}
