# Error Handling

The GymSpace SDK provides a comprehensive error handling system with typed exceptions and standardized error codes.

## Error Types

```typescript
// Base error class
class GymSpaceError extends Error {
  code: string;
  statusCode: number;
  details?: any;
  timestamp: Date;
  requestId?: string;
}

// Specific error types
class ValidationError extends GymSpaceError {
  validationErrors: ValidationErrorDetail[];
}

class AuthenticationError extends GymSpaceError {
  // 401 Unauthorized
}

class AuthorizationError extends GymSpaceError {
  // 403 Forbidden
  requiredPermission?: string;
}

class NotFoundError extends GymSpaceError {
  // 404 Not Found
  resourceType?: string;
  resourceId?: string;
}

class ConflictError extends GymSpaceError {
  // 409 Conflict
  conflictingResource?: any;
}

class RateLimitError extends GymSpaceError {
  // 429 Too Many Requests
  retryAfter?: number;
  limit?: number;
  remaining?: number;
}

class ServerError extends GymSpaceError {
  // 500+ Server errors
}
```

## Basic Error Handling

```typescript
try {
  const member = await sdk.members.create({
    personalInfo: {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('1990-01-15')
    },
    contactInfo: {
      email: 'john@example.com',
      phoneNumber: '+1234567890'
    }
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.validationErrors);
    // Handle validation errors
    error.validationErrors.forEach(err => {
      console.error(`${err.field}: ${err.message}`);
    });
  } else if (error instanceof ConflictError) {
    console.error('Member already exists');
  } else if (error instanceof AuthorizationError) {
    console.error('Insufficient permissions:', error.requiredPermission);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Error Codes

Common error codes used throughout the SDK:

```typescript
enum ErrorCodes {
  // Validation errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_DATE = 'INVALID_DATE',
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_PHONE = 'INVALID_PHONE',
  
  // Authentication/Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // Business logic errors
  MEMBER_INACTIVE = 'MEMBER_INACTIVE',
  CONTRACT_EXPIRED = 'CONTRACT_EXPIRED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  LIMIT_EXCEEDED = 'LIMIT_EXCEEDED',
  
  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}
```

## Handling Specific Errors

### Validation Errors

```typescript
try {
  await sdk.members.create(invalidData);
} catch (error) {
  if (error instanceof ValidationError) {
    // Access detailed validation errors
    error.validationErrors.forEach(validationError => {
      console.error(`Field: ${validationError.field}`);
      console.error(`Message: ${validationError.message}`);
      console.error(`Code: ${validationError.code}`);
      
      // Handle specific validation codes
      switch (validationError.code) {
        case 'REQUIRED':
          // Handle missing required field
          break;
        case 'INVALID_FORMAT':
          // Handle format errors
          break;
        case 'MIN_LENGTH':
          // Handle minimum length violations
          break;
      }
    });
  }
}
```

### Authentication Errors

```typescript
try {
  await sdk.auth.signIn({ email, password });
} catch (error) {
  if (error instanceof AuthenticationError) {
    switch (error.code) {
      case ErrorCodes.INVALID_CREDENTIALS:
        alert('Invalid email or password');
        break;
      case ErrorCodes.TOKEN_EXPIRED:
        // Redirect to login
        window.location.href = '/login';
        break;
      case ErrorCodes.UNAUTHORIZED:
        // Handle unauthorized access
        break;
    }
  }
}
```

### Rate Limiting

```typescript
try {
  await sdk.members.list({ page: 1 });
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limit exceeded. Retry after ${error.retryAfter} seconds`);
    console.log(`Limit: ${error.limit}, Remaining: ${error.remaining}`);
    
    // Implement exponential backoff
    await wait(error.retryAfter * 1000);
    // Retry the request
  }
}
```

## Global Error Handler

```typescript
// Set up global error handler
sdk.setErrorHandler((error: GymSpaceError) => {
  // Log to error tracking service
  console.error('API Error:', {
    code: error.code,
    message: error.message,
    statusCode: error.statusCode,
    requestId: error.requestId,
    timestamp: error.timestamp
  });
  
  // Show user-friendly message
  if (error.statusCode >= 500) {
    showNotification('Something went wrong. Please try again later.');
  }
});
```

## Retry Logic

```typescript
// Configure automatic retry
sdk.configure({
  retry: {
    maxAttempts: 3,
    backoff: 'exponential', // or 'linear'
    initialDelay: 1000,
    maxDelay: 10000,
    retryableErrors: [
      ErrorCodes.SERVICE_UNAVAILABLE,
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      ErrorCodes.INTERNAL_ERROR
    ]
  }
});

// Manual retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 3
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (
        attempt === maxAttempts ||
        !isRetryableError(error)
      ) {
        throw error;
      }
      
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Usage
const member = await retryWithBackoff(() => 
  sdk.members.getById('member-uuid')
);
```

## Error Recovery Strategies

```typescript
// Graceful degradation
async function getMemberWithFallback(id: string) {
  try {
    // Try to get fresh data
    return await sdk.members.getById(id);
  } catch (error) {
    if (error instanceof ServerError) {
      // Fall back to cached data
      const cached = await getCachedMember(id);
      if (cached) {
        console.warn('Using cached data due to server error');
        return cached;
      }
    }
    throw error;
  }
}

// Circuit breaker pattern
class CircuitBreaker {
  private failures = 0;
  private lastFailTime?: Date;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private threshold = 5,
    private timeout = 60000 // 1 minute
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailTime!.getTime() > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await fn();
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
      }
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailTime = new Date();
      
      if (this.failures >= this.threshold) {
        this.state = 'open';
      }
      
      throw error;
    }
  }
}
```

## Error Context and Debugging

```typescript
// Enhanced error information
try {
  await sdk.members.create(data);
} catch (error) {
  if (error instanceof GymSpaceError) {
    console.error('Error Context:', {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      requestId: error.requestId, // Use for support tickets
      timestamp: error.timestamp,
      details: error.details,
      stack: error.stack
    });
    
    // Report to error tracking service
    errorReporter.captureException(error, {
      user: currentUser,
      context: {
        operation: 'member.create',
        gymId: sdk.getGymId()
      }
    });
  }
}
```

## Custom Error Handling

```typescript
// Create custom error handler
class CustomErrorHandler {
  handle(error: GymSpaceError): void {
    // Log error
    this.logError(error);
    
    // Show user notification
    this.notifyUser(error);
    
    // Track in analytics
    this.trackError(error);
  }
  
  private logError(error: GymSpaceError): void {
    console.error(`[${error.code}] ${error.message}`, {
      statusCode: error.statusCode,
      requestId: error.requestId,
      details: error.details
    });
  }
  
  private notifyUser(error: GymSpaceError): void {
    const userMessage = this.getUserMessage(error);
    showNotification(userMessage, 'error');
  }
  
  private getUserMessage(error: GymSpaceError): string {
    const messages: Record<string, string> = {
      [ErrorCodes.VALIDATION_FAILED]: 'Please check your input and try again.',
      [ErrorCodes.UNAUTHORIZED]: 'Please log in to continue.',
      [ErrorCodes.FORBIDDEN]: 'You don\'t have permission to perform this action.',
      [ErrorCodes.NOT_FOUND]: 'The requested resource was not found.',
      [ErrorCodes.CONFLICT]: 'This resource already exists.',
      [ErrorCodes.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later.',
      [ErrorCodes.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable.'
    };
    
    return messages[error.code] || 'An unexpected error occurred.';
  }
  
  private trackError(error: GymSpaceError): void {
    analytics.track('api_error', {
      code: error.code,
      statusCode: error.statusCode,
      message: error.message
    });
  }
}

// Use custom handler
sdk.setErrorHandler(new CustomErrorHandler());
```