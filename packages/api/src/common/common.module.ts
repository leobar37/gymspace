import { Module, Global } from '@nestjs/common';
import { RequestContext } from './services/request-context.service';
import { PaginationService } from './services/pagination.service';
import { StorageService } from './services/storage.service';

@Global()
@Module({
  providers: [RequestContext, PaginationService, StorageService],
  exports: [RequestContext, PaginationService, StorageService],
})
export class CommonModule {}
