import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionStatusHelper } from './helpers/subscription-status.helper';

@Module({
  imports: [CommonModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionStatusHelper],
  exports: [SubscriptionsService, SubscriptionStatusHelper],
})
export class SubscriptionsModule {}
