import { createEventHandler, createCronHandler, IngestHandlerContext } from '../core/ingest';
import type { EventPayload } from 'inngest';

// Define specific event types for better type safety
interface HelloWorldEvent extends EventPayload {
  name: 'app/hello-world';
  data: {
    name?: string;
    [key: string]: any;
  };
}

interface GreetingEvent extends EventPayload {
  name: 'app/greeting';
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

interface GreetingResult {
  message: string;
  style: string;
  timestamp: string;
}

interface ScheduledResult {
  message: string;
  scheduledAt: string;
  type: string;
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
  async ({ event, step, logger }: IngestHandlerContext<HelloWorldEvent>): Promise<HelloWorldResult> => {
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
      const greetingText = event.data?.name 
        ? `Hello, ${event.data.name}!` 
        : 'Hello, World!';

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
  }
);

/**
 * Functional greeting handler
 */
export const functionalGreetingHandler = createEventHandler<GreetingEvent, GreetingResult>(
  {
    id: 'functional-greeting',
    name: 'Functional Greeting Handler',
    retries: 1,
  },
  'app/greeting',
  async ({ event, step, logger }: IngestHandlerContext<GreetingEvent>): Promise<GreetingResult> => {
    const name = await step.run('get-name', async () => {
      return event.data?.name || 'Functional World';
    });
    
    logger.log(`Greetings from functional handler to ${name}`);
    
    const greetingResult: GreetingResult = {
      message: `Hello from functional style, ${name}!`,
      style: 'functional',
      timestamp: new Date().toISOString(),
    };
    
    return greetingResult;
  }
);

/**
 * Scheduled hello world example
 */
export const scheduledHelloHandler = createCronHandler<ScheduledResult>(
  {
    id: 'scheduled-hello',
    name: 'Scheduled Hello Handler',
  },
  '0 9 * * *', // Daily at 9 AM
  async ({ step, logger }: IngestHandlerContext<EventPayload>): Promise<ScheduledResult> => {
    await step.run('log-schedule', async () => {
      logger.log('Daily hello from scheduled handler');
      return 'logged';
    });
    
    const result: ScheduledResult = {
      message: 'Good morning from scheduled handler!',
      scheduledAt: new Date().toISOString(),
      type: 'scheduled',
    };
    
    return result;
  }
);