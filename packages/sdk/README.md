# @gymspace/sdk

Official TypeScript SDK for the GymSpace API.

## Installation

```bash
npm install @gymspace/sdk
# or
yarn add @gymspace/sdk
# or
pnpm add @gymspace/sdk
```

## Quick Start

```typescript
import { GymSpaceSDK } from '@gymspace/sdk';

// Initialize the SDK
const sdk = new GymSpaceSDK({
  baseURL: 'https://api.gymspace.com',
  apiKey: 'your-api-key', // Optional
});

// Login
const { user, token } = await sdk.auth.login({
  email: 'user@example.com',
  password: 'password123',
});

// Set authentication token
sdk.setAuthToken(token);

// Use the SDK
const gyms = await sdk.gyms.list();
const clients = await sdk.clients.list();
```

## Features

- 🔐 **Authentication**: Login, logout, and session management
- 🏢 **Organizations**: Manage organizations and permissions
- 🏋️ **Gyms**: Complete gym management operations
- 👥 **Clients**: Client registration and management
- 📊 **Membership Plans**: Create and manage membership plans
- 📝 **Contracts**: Handle client contracts
- ✅ **Check-ins**: Track client check-ins
- 📈 **Evaluations**: Client evaluation management
- 🎯 **Leads**: Lead tracking and conversion
- 📁 **Files**: File upload and management
- 📊 **Dashboard**: Analytics and statistics

## API Reference

### Authentication

```typescript
// Login
const result = await sdk.auth.login({ email, password });

// Get current session
const session = await sdk.auth.getCurrentSession();

// Logout
await sdk.auth.logout();
```

### Gyms

```typescript
// List gyms
const gyms = await sdk.gyms.list({ page: 1, limit: 10 });

// Get gym by ID
const gym = await sdk.gyms.get('gym-id');

// Create gym
const newGym = await sdk.gyms.create({
  name: 'Fitness Center',
  address: '123 Main St',
  // ...
});

// Update gym
const updated = await sdk.gyms.update('gym-id', { name: 'New Name' });

// Delete gym
await sdk.gyms.delete('gym-id');
```

### Clients

```typescript
// List clients
const clients = await sdk.clients.list({ page: 1, limit: 20 });

// Create client
const client = await sdk.clients.create({
  email: 'client@example.com',
  name: 'John Doe',
  // ...
});

// Get client details
const clientDetails = await sdk.clients.get('client-id');
```

## Configuration

```typescript
const sdk = new GymSpaceSDK({
  baseURL: 'https://api.gymspace.com',
  timeout: 30000, // 30 seconds
  headers: {
    'X-Custom-Header': 'value',
  },
});

// Set auth token after login
sdk.setAuthToken('your-auth-token');

// Set gym context
sdk.setGymId('gym-id');
```

## Error Handling

```typescript
try {
  const result = await sdk.gyms.create(data);
} catch (error) {
  if (error.response) {
    // Server responded with error
    console.error('Error:', error.response.data);
  } else if (error.request) {
    // Request made but no response
    console.error('Network error:', error.message);
  } else {
    // Other errors
    console.error('Error:', error.message);
  }
}
```

## TypeScript Support

This SDK is written in TypeScript and provides full type definitions for all API responses and requests.

```typescript
import type { 
  IGym, 
  IClient, 
  IMembershipPlan 
} from '@gymspace/sdk';
```

## License

MIT © GymSpace Team
