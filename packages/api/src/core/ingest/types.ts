import { ModuleRef } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import type { Inngest, EventPayload, GetStepTools } from 'inngest';

/**
 * Context provided to handler functions with access to NestJS container
 */
export interface IngestHandlerContext<TEvent extends EventPayload = EventPayload> {
  event: TEvent;
  step: GetStepTools<Inngest.Any>;
  runId: string;
  attempt: number;
  injector: ModuleRef;
  logger: Logger;
}

/**
 * Handler function type with NestJS container access
 */
export type IngestHandlerFunction<
  TEvent extends EventPayload = EventPayload,
  TResult = unknown
> = (context: IngestHandlerContext<TEvent>) => Promise<TResult>;

/**
 * Configuration for Inngest function
 */
export interface IngestFunctionConfig {
  id: string;
  name?: string;
  concurrency?: number;
  rateLimit?: {
    limit: number;
    period: `${number}s` | `${number}m` | `${number}h` | `${number}d`;
    key?: string;
  };
  retries?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20;
}

/**
 * Trigger configuration for Inngest function
 */
export type IngestTriggerConfig = { event: string; if?: string } | { cron: string };

/**
 * Handler creation context
 */
export interface IngestFunctionHandler {
  ingestClient: Inngest;
  injector: ModuleRef;
}

/**
 * Inngest function type
 */
export type InngestFunction = ReturnType<Inngest['createFunction']>;

/**
 * Handler creator function type
 */
export type HandlerCreator = (handler: IngestFunctionHandler) => InngestFunction;