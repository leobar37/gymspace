import { composeHandlers, IngestFunctionHandler, InngestFunction } from '../core/ingest';
import { contractLifecycleHandler } from './contract-lifecycle.handler';
import { helloWorldHandler } from './hello-world.handler';
import { subscriptionLifecycleHandler } from './subscription-lifecycle.handler';

/**
 * Register all Inngest function handlers (functional style)
 */
export const registerIngestHandlers = (ingestHandler: IngestFunctionHandler): InngestFunction[] => {
  const functions = composeHandlers(helloWorldHandler, contractLifecycleHandler, subscriptionLifecycleHandler)(ingestHandler);

  return functions;
};

/**
 * Export individual handlers for modular usage
 */
export { contractLifecycleHandler, helloWorldHandler, subscriptionLifecycleHandler };
