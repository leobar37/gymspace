# GymSpace SDK Documentation

Welcome to the GymSpace SDK documentation. This SDK provides a comprehensive interface for building applications that integrate with the GymSpace platform.

## Overview

The GymSpace SDK is designed to provide developers with a clean, type-safe interface to interact with the GymSpace API. It covers all major features of the platform including user management, gym operations, member management, and more.

## Features

- **Authentication & Authorization**: Secure authentication with Supabase integration
- **User Management**: Complete user lifecycle management
- **Gym Management**: Multi-tenant gym operations
- **Member Management**: Member profiles, subscriptions, and access control
- **Contract Management**: Subscription contracts and billing
- **Staff Management**: Employee roles and permissions
- **Asset Management**: File uploads and media handling
- **Settings & Configuration**: Gym-specific settings and preferences

## Getting Started

```typescript
import { GymSpaceSDK } from '@gymspace/sdk';

const sdk = new GymSpaceSDK({
  apiUrl: 'https://api.gymspace.com',
  apiKey: 'your-api-key',
  gymId: 'your-gym-id'
});
```

## Documentation Structure

- [Authentication](./authentication.md) - Authentication and authorization
- [Users](./users.md) - User management operations
- [Gyms](./gyms.md) - Gym management and multi-tenancy
- [Members](./members.md) - Member profiles and management
- [Contracts](./contracts.md) - Subscription contracts
- [Staff](./staff.md) - Staff and employee management
- [Assets](./assets.md) - File uploads and media
- [Settings](./settings.md) - Configuration and preferences
- [Pagination](./pagination.md) - Working with paginated responses
- [Error Handling](./error-handling.md) - Exception handling
- [Types](./types.md) - TypeScript type definitions