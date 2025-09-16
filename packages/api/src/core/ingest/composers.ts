import { IngestFunctionHandler, HandlerCreator, InngestFunction } from './types';
import { IngestFunctionRegistry } from './registry';

/**
 * Compose multiple handlers (functional style)
 * Follows functional composition patterns from Inngest best practices
 */
export const composeHandlers = (...handlerCreators: HandlerCreator[]) => {
  return (handler: IngestFunctionHandler): InngestFunction[] => {
    return handlerCreators.map((creator) => creator(handler));
  };
};

/**
 * Register handlers in sequence
 */
export const registerHandlers = (
  handler: IngestFunctionHandler,
  ...handlerCreators: HandlerCreator[]
): InngestFunction[] => {
  return handlerCreators.map((creator) => creator(handler));
};

/**
 * Get all registered functions (for serving)
 */
export const getRegisteredFunctions = (): InngestFunction[] => {
  return IngestFunctionRegistry.getFunctions();
};

/**
 * Get registered function count
 */
export const getHandlerCount = (): number => {
  return IngestFunctionRegistry.getCount();
};
