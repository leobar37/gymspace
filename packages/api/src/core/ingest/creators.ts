import { Logger } from '@nestjs/common';
import type { EventPayload } from 'inngest';
import { IngestFunctionRegistry } from './registry';
import {
  IngestFunctionConfig,
  IngestHandlerFunction,
  IngestFunctionHandler,
  IngestHandlerContext,
  InngestFunction,
} from './types';

/**
 * Create an event handler (functional style)
 * Follows Inngest best practices for function creation
 */
export const createEventHandler = <TEvent extends EventPayload = EventPayload, TResult = unknown>(
  config: IngestFunctionConfig,
  eventName: string,
  handler: IngestHandlerFunction<TEvent, TResult>,
): ((context: IngestFunctionHandler) => InngestFunction) => {
  return ({ ingestClient, injector }: IngestFunctionHandler): InngestFunction => {
    const logger = new Logger(`IngestFunction:${config.id}`);

    const inngestFunction = ingestClient.createFunction(
      config,
      { event: eventName },
      async (context) => {
        const handlerContext: IngestHandlerContext<TEvent> = {
          event: context.event as TEvent,
          step: context.step,
          runId: context.runId,
          attempt: context.attempt,
          injector,
          logger,
        };

        try {
          logger.debug(`Executing function ${config.id}`, {
            runId: context.runId,
            attempt: context.attempt,
          });

          const result = await handler(handlerContext);

          logger.debug(`Function ${config.id} completed successfully`, {
            runId: context.runId,
          });

          return result;
        } catch (error) {
          logger.error(`Function ${config.id} failed`, {
            runId: context.runId,
            attempt: context.attempt,
            error: error.message,
          });
          throw error;
        }
      },
    );

    IngestFunctionRegistry.register(inngestFunction);
    logger.log(`Registered Inngest function: ${config.id}`);

    return inngestFunction;
  };
};

/**
 * Create a cron handler (functional style)
 * Follows Inngest best practices for scheduled functions
 */
export const createCronHandler = <TResult = unknown>(
  config: IngestFunctionConfig,
  cron: string,
  handler: IngestHandlerFunction<EventPayload, TResult>,
): ((context: IngestFunctionHandler) => InngestFunction) => {
  return ({ ingestClient, injector }: IngestFunctionHandler): InngestFunction => {
    const logger = new Logger(`IngestFunction:${config.id}`);

    const inngestFunction = ingestClient.createFunction(config, { cron }, async (context) => {
      const handlerContext: IngestHandlerContext<EventPayload> = {
        event: context.event,
        step: context.step,
        runId: context.runId,
        attempt: context.attempt,
        injector,
        logger,
      };

      try {
        logger.debug(`Executing function ${config.id}`, {
          runId: context.runId,
          attempt: context.attempt,
        });

        const result = await handler(handlerContext);

        logger.debug(`Function ${config.id} completed successfully`, {
          runId: context.runId,
        });

        return result;
      } catch (error) {
        logger.error(`Function ${config.id} failed`, {
          runId: context.runId,
          attempt: context.attempt,
          error: error.message,
        });
        throw error;
      }
    });

    IngestFunctionRegistry.register(inngestFunction);
    logger.log(`Registered Inngest function: ${config.id}`);

    return inngestFunction;
  };
};
