# Ingest Handlers (Inngest Integration)

## Overview

The Ingest system provides event-driven processing capabilities using Inngest for background jobs, scheduled tasks, and event handling. It integrates seamlessly with NestJS dependency injection while maintaining a functional programming approach.

## Architecture

### Core Components

- **IngestClient** (`src/core/ingest/client.ts`) - Main Inngest client for sending events
- **Handler System** (`src/core/ingest/`) - Functional composition system for creating handlers
- **Setup** (`src/setup/ingest-setup.ts`) - Initialization and registration logic
- **Handlers** (`src/handlers/`) - Application-specific event handlers

### Functional Composition Pattern

The system uses a functional composition approach with the following structure:

```
src/core/ingest/
├── types.ts           # Type definitions
├── registry.ts        # Handler registry management
├── creators.ts        # Handler creation functions
├── composers.ts       # Function composition utilities
├── client.ts          # Inngest client
└── index.ts          # Re-exports
```

## Configuration

### Environment Variables

```bash
# Required
INNGEST_EVENT_KEY=your_inngest_event_key

# Optional
NODE_ENV=development|production
```

### NestJS Integration

The system automatically initializes during application bootstrap via `main.ts`:

```typescript
// Automatic setup in main.ts
await setupIngestHandlers(app, logger);
```

## Creating Event Handlers

### Basic Event Handler

```typescript
// src/handlers/example.handler.ts
import { createEventHandler } from '../core/ingest/creators';
import type { IngestFunctionHandler } from '../core/ingest/types';

export const exampleHandler = (handler: IngestFunctionHandler) => {
  return createEventHandler(
    {
      id: 'example-event-handler',
      event: 'app/example.triggered'
    },
    async ({ event, step }) => {
      const { injector } = handler;
      
      // Access NestJS services
      const someService = injector.get(SomeService);
      
      // Process the event
      await step.run('process-data', async () => {
        return someService.processData(event.data);
      });
    }
  );
};
```

### Scheduled Handler (Cron Jobs)

```typescript
// src/handlers/scheduled.handler.ts
import { createCronHandler } from '../core/ingest/creators';

export const dailyReportHandler = (handler: IngestFunctionHandler) => {
  return createCronHandler(
    {
      id: 'daily-report-generator',
      cron: '0 8 * * *' // Every day at 8 AM
    },
    async ({ step }) => {
      const { injector } = handler;
      
      const reportService = injector.get(ReportService);
      
      await step.run('generate-daily-report', async () => {
        return reportService.generateDailyReport();
      });
    }
  );
};
```

## Registering Handlers

### Handler Registration

All handlers must be registered in `src/handlers/index.ts`:

```typescript
import { composeHandlers } from '../core/ingest/composers';
import { exampleHandler } from './example.handler';
import { dailyReportHandler } from './scheduled.handler';

// Compose all handlers
const allHandlers = composeHandlers(
  exampleHandler,
  dailyReportHandler
  // Add new handlers here
);

// Export registration function
export const registerIngestHandlers = (ingestHandler: IngestFunctionHandler) => {
  return allHandlers(ingestHandler);
};
```

## Sending Events

### Using IngestClient Service

```typescript
// In any NestJS service
@Injectable()
export class ExampleService {
  constructor(private readonly ingestClient: IngestClient) {}

  async triggerBackgroundTask(data: any) {
    await this.ingestClient.sendEvent('app/example.triggered', {
      payload: data,
      timestamp: new Date(),
      userId: 'user-123'
    });
  }

  async sendBatchEvents(events: Array<{ name: string; data: any }>) {
    await this.ingestClient.sendEvents(events);
  }
}
```

### Event Options

```typescript
await this.ingestClient.sendEvent('event.name', data, {
  // Schedule for later
  at: new Date(Date.now() + 3600000), // 1 hour from now
  
  // Add event ID for deduplication
  id: 'unique-event-id',
  
  // Add user context
  user: { id: 'user-123' }
});
```

## Advanced Features

### Multi-Step Functions

```typescript
export const complexWorkflowHandler = (handler: IngestFunctionHandler) => {
  return createEventHandler(
    {
      id: 'complex-workflow',
      event: 'workflow/complex.started'
    },
    async ({ event, step }) => {
      const { injector } = handler;
      
      // Step 1: Validate data
      const validatedData = await step.run('validate', async () => {
        const validator = injector.get(ValidationService);
        return validator.validate(event.data);
      });

      // Step 2: Process with external API
      const apiResponse = await step.run('external-api', async () => {
        const apiService = injector.get(ExternalApiService);
        return apiService.process(validatedData);
      });

      // Step 3: Save results
      await step.run('save-results', async () => {
        const dbService = injector.get(DatabaseService);
        return dbService.saveResults(apiResponse);
      });
    }
  );
};
```

### Error Handling and Retries

```typescript
export const resilientHandler = (handler: IngestFunctionHandler) => {
  return createEventHandler(
    {
      id: 'resilient-handler',
      event: 'app/critical.task',
      retries: 3,
      rateLimit: {
        limit: 10,
        period: '1m'
      }
    },
    async ({ event, step }) => {
      try {
        await step.run('critical-operation', async () => {
          // Your critical operation here
          const service = handler.injector.get(CriticalService);
          return service.performCriticalTask(event.data);
        });
      } catch (error) {
        // Log error but let Inngest handle retries
        console.error('Critical task failed:', error);
        throw error;
      }
    }
  );
};
```

## Testing

### Unit Testing Handlers

```typescript
// tests/handlers/example.handler.spec.ts
describe('ExampleHandler', () => {
  let mockHandler: IngestFunctionHandler;
  let mockService: jest.Mocked<SomeService>;

  beforeEach(() => {
    mockService = createMock<SomeService>();
    mockHandler = {
      ingestClient: createMock<IngestClient>(),
      injector: {
        get: jest.fn().mockReturnValue(mockService)
      } as any
    };
  });

  it('should process event data correctly', async () => {
    const handler = exampleHandler(mockHandler);
    
    await handler.handler({
      event: { data: { test: 'data' } },
      step: createMockStep()
    } as any);

    expect(mockService.processData).toHaveBeenCalledWith({ test: 'data' });
  });
});
```

### Integration Testing

```typescript
// tests/ingest/integration.spec.ts
describe('Ingest Integration', () => {
  let app: INestApplication;
  let ingestClient: IngestClient;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();
    
    app = module.createNestApplication();
    await app.init();
    
    ingestClient = app.get(IngestClient);
  });

  it('should send and receive events', async () => {
    await ingestClient.sendEvent('test/event', { testData: 'value' });
    
    // Verify event was processed
    // Implementation depends on your testing setup
  });
});
```

## Best Practices

### Handler Organization

1. **Group by Domain**: Organize handlers by business domain
2. **Single Responsibility**: Each handler should have one clear purpose
3. **Descriptive Names**: Use clear, descriptive handler and event names
4. **Error Boundaries**: Handle errors appropriately and let Inngest manage retries

### Performance Considerations

1. **Efficient Steps**: Break complex operations into logical steps
2. **Resource Management**: Be mindful of memory usage in long-running handlers
3. **Rate Limiting**: Use rate limiting for external API calls
4. **Batch Processing**: Process multiple items efficiently when possible

### Event Naming Convention

```typescript
// Recommended event naming pattern:
'domain/resource.action'

// Examples:
'users/user.created'
'orders/order.completed'
'notifications/email.failed'
'reports/daily-report.requested'
```

## Monitoring and Debugging

### Logging

The system includes comprehensive logging:

```typescript
// Logs are automatically generated for:
- Handler registration success/failure
- Function execution in development mode
- Configuration validation warnings
```

### Development Mode

In development, additional logging is enabled:

```typescript
// Environment detection
const nodeEnv = process.env.NODE_ENV || 'development';
if (nodeEnv === 'development' && registeredFunctions.length > 0) {
  // Detailed function logging
}
```

### Production Considerations

1. **Environment Variables**: Ensure all required env vars are set
2. **Error Monitoring**: Integrate with your error tracking service
3. **Metrics**: Monitor handler performance and success rates
4. **Scaling**: Consider handler concurrency and rate limits

## Troubleshooting

### Common Issues

1. **Configuration Missing**: Check `INNGEST_EVENT_KEY` environment variable
2. **Service Injection Fails**: Ensure services are properly registered in modules
3. **Handler Not Registered**: Verify handler is added to `composeHandlers` call
4. **Event Not Triggering**: Check event name spelling and registration

### Debug Mode

Enable debug logging by setting:

```bash
NODE_ENV=development
```

This will show detailed handler registration and execution information.

## Migration from Other Systems

If migrating from other background job systems:

1. **From Bull/BullMQ**: Replace job processors with event handlers
2. **From Agenda**: Convert scheduled jobs to cron handlers
3. **From Custom Solutions**: Wrap existing logic in Inngest handlers

## Future Enhancements

Planned improvements:

- [ ] Handler hot-reloading in development
- [ ] Metrics and monitoring dashboard
- [ ] Handler testing utilities
- [ ] Advanced error handling patterns
- [ ] Event schema validation
- [ ] Handler performance profiling

---

For more information, see the [Inngest documentation](https://www.inngest.com/docs) or contact the development team.