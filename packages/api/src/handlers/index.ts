import { IngestFunctionHandler, InngestFunction } from '../core/ingest';
import { 
  helloWorldHandler, 
  functionalGreetingHandler, 
  scheduledHelloHandler 
} from './hello-world.handler';

/**
 * Register all Inngest function handlers (functional style)
 */
export const registerIngestHandlers = (ingestHandler: IngestFunctionHandler): InngestFunction[] => {
  // Register functional handlers
  const functions = [
    helloWorldHandler(ingestHandler),
    functionalGreetingHandler(ingestHandler),
    scheduledHelloHandler(ingestHandler)
  ];

  // Alternative: Using functional composition
  // const functions = composeHandlers(
  //   helloWorldHandler,
  //   functionalGreetingHandler,
  //   scheduledHelloHandler
  // )(ingestHandler);

  return functions;
};

/**
 * Export individual handlers for modular usage
 */
export {
  helloWorldHandler,
  functionalGreetingHandler,
  scheduledHelloHandler
};