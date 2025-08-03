# User Management

The Users module provides comprehensive user management capabilities including profile management, role assignments, and user lifecycle operations.

## User Object

```typescript
interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  isActive: boolean;
  emailVerified: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

## Get Current User

```typescript
const currentUser = await sdk.users.getCurrentUser();
console.log(currentUser.fullName);
```

## Get User by ID

```typescript
const user = await sdk.users.getById('user-uuid');
```

## List Users

```typescript
// List all users with pagination
const { data: users, meta } = await sdk.users.list({
  page: 1,
  limit: 20,
  search: 'john',
  orderBy: 'createdAt',
  order: 'desc'
});

// Filter by gym
const gymUsers = await sdk.users.list({
  gymId: 'gym-uuid'
});

// Filter by role
const admins = await sdk.users.list({
  role: 'admin'
});
```

## Create User

```typescript
const newUser = await sdk.users.create({
  email: 'newuser@example.com',
  fullName: 'Jane Doe',
  phoneNumber: '+1234567890',
  role: 'member',
  sendInviteEmail: true
});
```

## Update User

```typescript
const updatedUser = await sdk.users.update('user-uuid', {
  fullName: 'Jane Smith',
  phoneNumber: '+0987654321',
  metadata: {
    preferences: {
      notifications: true,
      newsletter: false
    }
  }
});

// Update current user profile
const profile = await sdk.users.updateProfile({
  fullName: 'John Updated',
  avatarUrl: 'https://example.com/avatar.jpg'
});
```

## User Roles

```typescript
// Get user roles
const roles = await sdk.users.getRoles('user-uuid');

// Assign role to user
await sdk.users.assignRole('user-uuid', {
  roleId: 'role-uuid',
  gymId: 'gym-uuid' // Optional, for gym-specific roles
});

// Remove role from user
await sdk.users.removeRole('user-uuid', 'role-uuid');

// Check if user has specific role
const hasRole = await sdk.users.hasRole('user-uuid', 'admin');
```

## User Permissions

```typescript
// Get all user permissions
const permissions = await sdk.users.getPermissions('user-uuid');

// Check specific permission
const canCreateMembers = await sdk.users.hasPermission(
  'user-uuid',
  'MEMBERS_CREATE'
);

// Get permissions for specific gym
const gymPermissions = await sdk.users.getGymPermissions(
  'user-uuid',
  'gym-uuid'
);
```

## User Status Management

```typescript
// Activate user
await sdk.users.activate('user-uuid');

// Deactivate user
await sdk.users.deactivate('user-uuid');

// Delete user (soft delete)
await sdk.users.delete('user-uuid');

// Restore deleted user
await sdk.users.restore('user-uuid');
```

## Email Verification

```typescript
// Send verification email
await sdk.users.sendVerificationEmail('user-uuid');

// Verify email with token
await sdk.users.verifyEmail({
  userId: 'user-uuid',
  token: 'verification-token'
});

// Check verification status
const isVerified = await sdk.users.isEmailVerified('user-uuid');
```

## Password Management

```typescript
// Request password reset
await sdk.users.requestPasswordReset('user@example.com');

// Reset password with token
await sdk.users.resetPassword({
  token: 'reset-token',
  newPassword: 'newSecurePassword123'
});

// Change password (requires current password)
await sdk.users.changePassword({
  currentPassword: 'oldPassword',
  newPassword: 'newPassword123'
});
```

## User Search

```typescript
// Advanced search
const results = await sdk.users.search({
  query: 'john',
  filters: {
    isActive: true,
    emailVerified: true,
    role: ['admin', 'staff'],
    createdAfter: new Date('2024-01-01'),
    createdBefore: new Date('2024-12-31')
  },
  page: 1,
  limit: 10
});
```

## Bulk Operations

```typescript
// Bulk invite users
const invites = await sdk.users.bulkInvite([
  { email: 'user1@example.com', role: 'member' },
  { email: 'user2@example.com', role: 'staff' }
]);

// Bulk update users
await sdk.users.bulkUpdate({
  userIds: ['uuid1', 'uuid2', 'uuid3'],
  updates: {
    isActive: false,
    metadata: { migrated: true }
  }
});
```

## User Activity

```typescript
// Get user activity log
const activities = await sdk.users.getActivityLog('user-uuid', {
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  limit: 50
});

// Get last login info
const lastLogin = await sdk.users.getLastLogin('user-uuid');
```