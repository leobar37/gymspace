import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { CommonModule } from '../../common/common.module';

// Helper Services
import { SaleNumberService } from './helpers/sale-number.service';
import { SaleValidationService } from './helpers/sale-validation.service';
import { StockManagementService } from './helpers/stock-management.service';
import { SaleStatisticsService } from './helpers/sale-statistics.service';

@Module({
  imports: [CommonModule],
  controllers: [SalesController],
  providers: [
    SalesService,
    SaleNumberService,
    SaleValidationService,
    StockManagementService,
    SaleStatisticsService,
  ],
  exports: [SalesService],
})
export class SalesModule {}
