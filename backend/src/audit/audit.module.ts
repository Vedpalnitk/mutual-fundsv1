import { Global, Module } from '@nestjs/common'
import { AuditService } from './audit.service'
import { AuditLogService } from '../common/services/audit-log.service'

@Global()
@Module({
  providers: [AuditService, AuditLogService],
  exports: [AuditService, AuditLogService],
})
export class AuditModule {}
