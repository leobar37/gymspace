import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ModuleRef } from '@nestjs/core';
import { LoggerService } from '../core/logger/logger.service';
import { IngestClient } from '../core/ingest/client';
import { IngestFunctionHandler, getHandlerCount } from '../core/ingest';
import { registerIngestHandlers } from '../handlers';

import { serve } from 'inngest/fastify';

export async function setupIngestHandlers(
  app: NestFastifyApplication,
  logger: LoggerService,
): Promise<void> {
  try {
    // Get required services from NestJS container
    const ingestClient = app.get(IngestClient);
    const moduleRef = app.get(ModuleRef);

    // Create handler context
    const ingestHandler: IngestFunctionHandler = {
      ingestClient: ingestClient.inngest,
      injector: moduleRef,
    };

    // Register all handlers using functional composition
    const registeredFunctions = registerIngestHandlers(ingestHandler);
    const handlerCount = getHandlerCount();

    // Get the raw Fastify instance
    const fastifyInstance = app.getHttpAdapter().getInstance();

    // Register Inngest using the documented pattern
    fastifyInstance.route({
      method: ['GET', 'POST', 'PUT'],
      url: '/api/inngest',
      handler: serve({
        client: ingestClient.inngest,
        functions: registeredFunctions,
      }) as any,
    });

    // Log successful registration
    logger.log(
      `Inngest handlers registered successfully: ${handlerCount} functions`,
      'IngestSetup',
    );

    // Log function details in development
    const nodeEnv = process.env.NODE_ENV || 'development';
    if (
      nodeEnv === 'development' &&
      Array.isArray(registeredFunctions) &&
      registeredFunctions.length > 0
    ) {
      logger.debug(`Registered ${registeredFunctions.length} Inngest functions`, 'IngestSetup');
    }
  } catch (error) {
    logger.error('Failed to register Inngest handlers:', error, 'IngestSetup');
    // Don't throw - let the app continue without Inngest handlers
    // This allows the API to work even if Inngest is not properly configured
  }
}

/**
 * Validate Inngest configuration
 */
export function validateIngestConfig(): boolean {
  const requiredEnvVars = ['INNGEST_EVENT_KEY'];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.warn(`Warning: ${envVar} not set. Inngest functionality may be limited.`);
      return false;
    }
  }

  return true;
}
