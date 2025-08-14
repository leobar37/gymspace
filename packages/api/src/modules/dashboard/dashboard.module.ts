import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { CommonModule } from '../../common/common.module';
import { CacheModule } from '../../core/cache/cache.module';

@Module({
  imports: [CommonModule, CacheModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
