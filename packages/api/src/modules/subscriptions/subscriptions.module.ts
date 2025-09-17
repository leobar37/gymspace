import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { AdminSubscriptionController } from './controllers/admin-subscription.controller';
import { AdminSubscriptionService } from './services/admin-subscription.service';
import { SubscriptionOperationsController } from './controllers/subscription-operations.controller';
import { ProrationCalculationService } from './services/proration-calculation.service';
import { SubscriptionDateManagerService } from './services/subscription-date-manager.service';
import { SubscriptionTransitionService } from './services/subscription-transition.service';
import { SubscriptionAnalyticsService } from './services/subscription-analytics.service';
import { SubscriptionNotificationService } from './services/subscription-notification.service';
import { SubscriptionCacheService } from './services/subscription-cache.service';

@Module({
  imports: [CommonModule],
  controllers: [
    SubscriptionsController, 
    AdminSubscriptionController,
    SubscriptionOperationsController,
  ],
  providers: [
    SubscriptionsService, 
    AdminSubscriptionService,
    ProrationCalculationService,
    SubscriptionDateManagerService,
    SubscriptionTransitionService,
    SubscriptionAnalyticsService,
    SubscriptionNotificationService,
    SubscriptionCacheService,
  ],
  exports: [
    SubscriptionsService, 
    AdminSubscriptionService,
    ProrationCalculationService,
    SubscriptionDateManagerService,
    SubscriptionTransitionService,
    SubscriptionAnalyticsService,
    SubscriptionNotificationService,
    SubscriptionCacheService,
  ],
})
export class SubscriptionsModule {}
