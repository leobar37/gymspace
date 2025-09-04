import { createCronHandler, IngestHandlerContext } from '../core/ingest';
import { ContractStatusHelper } from '../modules/contracts/helpers/contract-status.helper';
import type { EventPayload } from 'inngest';

/**
 * Contract lifecycle management handler - runs twice daily at 8 AM and 8 PM
 * This handler manages the complete contract lifecycle:
 * 1. Updates contracts approaching expiration to expiring_soon status
 * 2. Processes expired contracts and activates their renewals
 * 3. Reactivates frozen contracts when freeze period ends
 */
export const contractLifecycleHandler = createCronHandler(
  {
    id: 'contract-lifecycle-management',
    name: 'Contract Lifecycle Management',
    retries: 2,
  },
  '0 8,20 * * *', // Runs at 8:00 AM and 8:00 PM every day
  async ({ step, logger, injector }: IngestHandlerContext<EventPayload>) => {
    // Get the ContractStatusHelper service from the NestJS injector
    // Using strict: false to access services from non-exported modules
    const contractStatusHelper = injector.get(ContractStatusHelper, { strict: false });

    // Step 1: Log the start of the process
    await step.run('log-start', async () => {
      logger.log('Starting contract lifecycle management process');
      const stats = await contractStatusHelper.getContractStatusStats();

      logger.log('Initial contract statistics', {
        active: stats.active,
        expiringSoon: stats.expiringSoon,
        expired: stats.expired,
        needsUpdate: stats.needsUpdate,
      });

      return stats;
    });

    // Step 2: Process contracts approaching expiration
    const expiringSoonResult = await step.run('process-expiring-soon', async () => {
      try {
        const count = await contractStatusHelper.updateExpiringSoonContracts();

        logger.log(`Updated ${count} contracts to expiring_soon status`);

        return {
          success: true,
          count,
          description: 'Contracts approaching expiration (within 7 days) marked as expiring_soon',
        };
      } catch (error) {
        logger.error('Failed to process expiring soon contracts', error);
        return {
          success: false,
          count: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    // Step 3: Process expired contracts and their renewals
    const expiredResult = await step.run('process-expired-and-renewals', async () => {
      try {
        const result = await contractStatusHelper.processExpiredContracts();

        logger.log('Expired contracts processing completed', {
          expiredCount: result.expiredCount,
          renewalsActivated: result.renewalsActivated,
          errorsCount: result.errors.length,
        });

        if (result.errors.length > 0) {
          logger.warn('Some contracts had errors during processing', {
            errors: result.errors,
          });
        }

        return {
          success: true,
          ...result,
          description: 'Expired contracts marked as expired and eligible renewals activated',
        };
      } catch (error) {
        logger.error('Failed to process expired contracts', error);
        return {
          success: false,
          expiredCount: 0,
          renewalsActivated: 0,
          errors: [],
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    // Step 4: Process frozen contracts that should be reactivated
    const frozenResult = await step.run('process-frozen-contracts', async () => {
      try {
        const result = await contractStatusHelper.processFrozenContracts();

        logger.log('Frozen contracts processing completed', {
          reactivatedCount: result.reactivatedCount,
          stillFrozenCount: result.stillFrozenCount,
          errorsCount: result.errors.length,
        });

        if (result.errors.length > 0) {
          logger.warn('Some frozen contracts had errors during processing', {
            errors: result.errors,
          });
        }

        return {
          success: true,
          ...result,
          description: 'Frozen contracts checked and reactivated if freeze period ended',
        };
      } catch (error) {
        logger.error('Failed to process frozen contracts', error);
        return {
          success: false,
          reactivatedCount: 0,
          stillFrozenCount: 0,
          errors: [],
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    // Step 5: Get final statistics
    const finalStats = await step.run('get-final-stats', async () => {
      const stats = await contractStatusHelper.getContractStatusStats();

      logger.log('Final contract statistics', {
        active: stats.active,
        expiringSoon: stats.expiringSoon,
        expired: stats.expired,
        total: stats.total,
      });

      return stats;
    });

    // Step 6: Return comprehensive result
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
        renewalsActivated: expiredResult.renewalsActivated,
        errors: expiredResult.errors,
      },
      frozen: {
        processed: frozenResult.success,
        reactivatedCount: frozenResult.reactivatedCount,
        stillFrozenCount: frozenResult.stillFrozenCount,
        errors: frozenResult.errors,
      },
      finalStats: finalStats,
    };

    logger.log('Contract lifecycle management process completed', {
      expiringSoonCount: result.expiringSoon.count,
      expiredCount: result.expired.expiredCount,
      renewalsActivated: result.expired.renewalsActivated,
      frozenReactivated: result.frozen.reactivatedCount,
      totalErrors: (result.expired.errors?.length || 0) + (result.frozen.errors?.length || 0),
    });

    return result;
  },
);
