# Authentication

The GymSpace SDK uses Supabase for authentication with JWT tokens. All API requests require authentication except for public endpoints.

## Initial Setup

```typescript
import { GymSpaceSDK } from '@gymspace/sdk';

const sdk = new GymSpaceSDK({
  apiUrl: 'https://api.gymspace.com',
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseAnonKey: 'your-anon-key'
});
```

## Login

```typescript
// Email/Password login
const { user, session } = await sdk.auth.signIn({
  email: 'user@example.com',
  password: 'password123'
});

// The SDK automatically manages the session token
```

## Sign Up

```typescript
const { user, session } = await sdk.auth.signUp({
  email: 'newuser@example.com',
  password: 'password123',
  metadata: {
    fullName: 'John Doe'
  }
});
```

## Current User

```typescript
// Get current authenticated user
const user = await sdk.auth.getCurrentUser();

// Check if authenticated
const isAuthenticated = sdk.auth.isAuthenticated();
```

## Logout

```typescript
await sdk.auth.signOut();
```

## Session Management

```typescript
// Get current session
const session = sdk.auth.getSession();

// Refresh session
const newSession = await sdk.auth.refreshSession();

// Set custom auth header for specific requests
sdk.setAuthHeader('Bearer custom-token');
```

## Gym Context

Most operations require a gym context. Set it after authentication:

```typescript
// Set default gym for all requests
sdk.setGymId('gym-uuid');

// Or pass gym context per request
const members = await sdk.members.list({
  gymId: 'specific-gym-uuid'
});
```

## Permission Checking

```typescript
// Check if user has specific permission
const hasPermission = await sdk.auth.hasPermission('MEMBERS_CREATE');

// Get all user permissions
const permissions = await sdk.auth.getUserPermissions();
```

## Error Handling

```typescript
try {
  await sdk.auth.signIn({ email, password });
} catch (error) {
  if (error.code === 'INVALID_CREDENTIALS') {
    console.error('Invalid email or password');
  } else if (error.code === 'USER_NOT_FOUND') {
    console.error('User does not exist');
  }
}
```

## Token Interceptors

```typescript
// Add token to all requests automatically
sdk.interceptors.request.use((config) => {
  const token = sdk.auth.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
sdk.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await sdk.auth.refreshSession();
      return sdk.request(error.config); // Retry request
    }
    return Promise.reject(error);
  }
);
```