import { Module } from '@nestjs/common';
import { AdminSubscriptionManagementController } from './admin-subscription-management.controller';
import { AdminSubscriptionManagementService } from './admin-subscription-management.service';

@Module({
  controllers: [AdminSubscriptionManagementController],
  providers: [AdminSubscriptionManagementService],
  exports: [AdminSubscriptionManagementService],
})
export class AdminSubscriptionManagementModule {}