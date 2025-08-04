import { Module, Global } from '@nestjs/common';
import { RequestContext } from './services/request-context.service';
import { PaginationService } from './services/pagination.service';

@Global()
@Module({
  providers: [RequestContext, PaginationService],
  exports: [RequestContext, PaginationService],
})
export class CommonModule {}
