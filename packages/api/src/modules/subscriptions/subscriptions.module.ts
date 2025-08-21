import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionCronService } from './subscription-cron.service';

@Module({
  imports: [CommonModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionCronService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
