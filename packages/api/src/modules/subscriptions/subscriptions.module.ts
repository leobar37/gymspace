import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionCronService } from './subscription-cron.service';
import { MercadoPagoService } from './mercadopago.service';
import { SubscriptionHelperService } from './subscription.helper';

@Module({
  imports: [CommonModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionCronService, MercadoPagoService, SubscriptionHelperService],
  exports: [SubscriptionsService, MercadoPagoService, SubscriptionHelperService],
})
export class SubscriptionsModule {}
