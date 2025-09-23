import { createCronHandler, IngestHandlerContext } from '../core/ingest';
import { SubscriptionStatusHelper } from '../modules/subscriptions/helpers/subscription-status.helper';
import type { EventPayload } from 'inngest';

/**
 * Subscription lifecycle management handler - runs daily at 9:00 AM
 * This handler manages the complete subscription lifecycle:
 * 1. Updates subscriptions approaching expiration to add warning flags
 * 2. Processes expired subscriptions and initiates grace periods
 * 3. Handles grace period subscriptions and suspends access when expired
 *
 * Expected Output Structure:
 * {
 *   "success": true,
 *   "timestamp": "2025-09-22T14:00:00.000Z",
 *   "expiringSoon": {
 *     "processed": true,
 *     "count": 5
 *   },
 *   "expired": {
 *     "processed": true,
 *     "expiredCount": 3,
 *     "gracePeriodExtended": 3,
 *     "organizationsNotified": 3,
 *     "errors": []
 *   },
 *   "gracePeriod": {
 *     "processed": true,
 *     "gracePeriodEnded": 1,
 *     "accessSuspended": 1,
 *     "errors": []
 *   },
 *   "finalStats": {
 *     "active": 45,
 *     "expiringSoon": 8,
 *     "expired": 2,
 *     "inactive": 1,
 *     "needsUpdate": {
 *       "expiringSoon": 0,
 *       "expired": 0,
 *       "total": 0
 *     },
 *     "total": 56
 *   }
 * }
 *
 * To test this handler:
 * 1. Run: pnpm run cli trigger:subscription:lifecycle (execute handler manually)
 * 2. Verify the output matches expected results
 * 3. Check subscription status changes in database
 */

export const subscriptionLifecycleHandler = createCronHandler(
  {
    id: 'subscription-lifecycle-management',
    name: 'Subscription Lifecycle Management',
    retries: 2,
  },
  '0 9 * * *',
  async ({ step, logger, injector }: IngestHandlerContext<EventPayload>) => {
    const subscriptionStatusHelper = injector.get(SubscriptionStatusHelper, { strict: false });

    await step.run('log-start', async () => {
      logger.log('Starting subscription lifecycle management process');
      const stats = await subscriptionStatusHelper.getSubscriptionStatusStats();

      logger.log('Initial subscription statistics', {
        active: stats.active,
        expiringSoon: stats.expiringSoon,
        expired: stats.expired,
        needsUpdate: stats.needsUpdate,
      });

      return stats;
    });

    const expiringSoonResult = await step.run('process-expiring-soon', async () => {
      try {
        const count = await subscriptionStatusHelper.updateExpiringSoonSubscriptions();

        logger.log(`Updated ${count} subscriptions to expiring_soon status`);

        return {
          success: true,
          count,
          description: 'Subscriptions approaching expiration (within 7 days) marked with warning flags',
        };
      } catch (error) {
        logger.error('Failed to process expiring soon subscriptions', error);
        return {
          success: false,
          count: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    const expiredResult = await step.run('process-expired-subscriptions', async () => {
      try {
        const result = await subscriptionStatusHelper.processExpiredSubscriptions();

        logger.log('Expired subscriptions processing completed', {
          expiredCount: result.expiredCount,
          gracePeriodExtended: result.gracePeriodExtended,
          errorsCount: result.errors.length,
        });

        return {
          success: true,
          ...result,
          description: 'Expired subscriptions processed and grace periods initiated',
        };
      } catch (error) {
        logger.error('Failed to process expired subscriptions', error);
        return {
          success: false,
          expiredCount: 0,
          gracePeriodExtended: 0,
          organizationsNotified: 0,
          errors: [],
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    const gracePeriodResult = await step.run('process-grace-period', async () => {
      try {
        const result = await subscriptionStatusHelper.processGracePeriodSubscriptions();

        logger.log('Grace period processing completed', {
          gracePeriodEnded: result.gracePeriodEnded,
          accessSuspended: result.accessSuspended,
          errorsCount: result.errors.length,
        });

        return {
          success: true,
          ...result,
          description: 'Grace period subscriptions evaluated and access managed',
        };
      } catch (error) {
        logger.error('Failed to process grace period subscriptions', error);
        return {
          success: false,
          gracePeriodEnded: 0,
          accessSuspended: 0,
          errors: [],
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    const finalStats = await step.run('get-final-stats', async () => {
      const stats = await subscriptionStatusHelper.getSubscriptionStatusStats();

      logger.log('Final subscription statistics', {
        active: stats.active,
        expiringSoon: stats.expiringSoon,
        expired: stats.expired,
        total: stats.total,
      });

      return stats;
    });

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      expiringSoon: {
        processed: expiringSoonResult.success,
        count: expiringSoonResult.count,
      },
      expired: {
        processed: expiredResult.success,
        expiredCount: expiredResult.expiredCount,
        gracePeriodExtended: expiredResult.gracePeriodExtended,
        errors: expiredResult.errors,
      },
      gracePeriod: {
        processed: gracePeriodResult.success,
        gracePeriodEnded: gracePeriodResult.gracePeriodEnded,
        accessSuspended: gracePeriodResult.accessSuspended,
        errors: gracePeriodResult.errors,
      },
      finalStats: finalStats,
    };

    logger.log('Subscription lifecycle management process completed', {
      expiringSoonCount: result.expiringSoon.count,
      expiredCount: result.expired.expiredCount,
      gracePeriodExtended: result.expired.gracePeriodExtended,
      gracePeriodEnded: result.gracePeriod.gracePeriodEnded,
      totalErrors: (result.expired.errors?.length || 0) + (result.gracePeriod.errors?.length || 0),
    });

    return result;
  },
);