import { Module, Global } from '@nestjs/common';
import { RequestContextService } from './services/request-context.service';
import { PaginationService } from './services/pagination.service';

@Global()
@Module({
  providers: [RequestContextService, PaginationService],
  exports: [RequestContextService, PaginationService],
})
export class CommonModule {}
