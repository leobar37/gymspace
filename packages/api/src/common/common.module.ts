import { Module, Global } from '@nestjs/common';
import { RequestContext } from './services/request-context.service';
import { PaginationService } from './services/pagination.service';
import { StorageService } from './services/storage.service';
import { AuditLoggerService } from './services/audit-logger.service';

@Global()
@Module({
  providers: [RequestContext, PaginationService, StorageService, AuditLoggerService],
  exports: [RequestContext, PaginationService, StorageService, AuditLoggerService],
})
export class CommonModule {}
