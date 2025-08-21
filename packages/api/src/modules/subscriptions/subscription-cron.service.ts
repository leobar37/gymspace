import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionsService } from './subscriptions.service';

@Injectable()
export class SubscriptionCronService {
  private readonly logger = new Logger(SubscriptionCronService.name);

  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  /**
   * Check for expired subscriptions daily at 6:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async checkExpiredSubscriptions() {
    this.logger.log('Starting daily subscription expiration check...');

    try {
      const result = await this.subscriptionsService.checkAndUpdateExpiredSubscriptions();

      if (result.updated > 0) {
        this.logger.log(
          `Updated ${result.updated} expired subscriptions: ${result.expired.join(', ')}`,
        );

        // TODO: Send notification emails to organization owners about expired subscriptions
        // TODO: Optionally trigger alerts or webhooks for expired subscriptions
      } else {
        this.logger.log('No expired subscriptions found');
      }
    } catch (error) {
      this.logger.error('Failed to check expired subscriptions', error);
    }
  }

  /**
   * Check for subscriptions expiring soon (7 days) daily at 7:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async checkExpiringSoonSubscriptions() {
    this.logger.log('Starting daily expiring soon subscription check...');

    try {
      // TODO: Implement logic to find subscriptions expiring in 7 days
      // TODO: Send reminder emails to organization owners about expiring subscriptions
      this.logger.log('Expiring soon check completed');
    } catch (error) {
      this.logger.error('Failed to check expiring soon subscriptions', error);
    }
  }

  /**
   * Manual trigger for testing purposes
   */
  async manualCheckExpiredSubscriptions() {
    this.logger.log('Manual subscription expiration check triggered...');
    return this.subscriptionsService.checkAndUpdateExpiredSubscriptions();
  }
}