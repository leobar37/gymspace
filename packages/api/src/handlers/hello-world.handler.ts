import type { EventPayload } from 'inngest';
import { createEventHandler, IngestHandlerContext } from '../core/ingest';

// Define specific event types for better type safety
interface HelloWorldEvent extends EventPayload {
  name: 'app/hello-world';
  data: {
    name?: string;
    [key: string]: any;
  };
}

// Define result types
interface HelloWorldResult {
  success: boolean;
  message: string;
  receivedData: any;
  greeting: string;
  timestamp: string;
  processed: boolean;
  completedAt: string;
}

/**
 * Hello World handler using functional style
 */
export const helloWorldHandler = createEventHandler<HelloWorldEvent, HelloWorldResult>(
  {
    id: 'hello-world',
    name: 'Hello World Handler',
    retries: 2,
  },
  'app/hello-world',
  async ({
    event,
    step,
    logger,
  }: IngestHandlerContext<HelloWorldEvent>): Promise<HelloWorldResult> => {
    // Example: Access NestJS services through injector
    // const someService = injector.get(SomeService);

    // Step 1: Log the incoming event
    await step.run('log-event', async () => {
      logger.log('Hello World function triggered!', {
        eventData: event.data,
      });
      return 'logged';
    });

    // Step 2: Process the data
    const greeting = await step.run('process-data', async () => {
      const greetingText = event.data?.name ? `Hello, ${event.data.name}!` : 'Hello, World!';

      logger.debug('Processing greeting', { greeting: greetingText });
      return greetingText;
    });

    // Step 3: Return final result
    const result: HelloWorldResult = {
      success: true,
      message: 'Event logged successfully',
      receivedData: event.data,
      greeting: greeting,
      timestamp: new Date().toISOString(),
      processed: true,
      completedAt: new Date().toISOString(),
    };

    logger.log('Hello World function completed', result);
    return result;
  },
);
