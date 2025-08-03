# Gym Management

The Gyms module handles multi-tenant gym operations including gym creation, configuration, and management.

## Gym Object

```typescript
interface Gym {
  id: string;
  name: string;
  slug: string;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  timezone: string;
  currency: string;
  logo?: string;
  website?: string;
  description?: string;
  settings: GymSettings;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface GymSettings {
  businessHours: BusinessHours;
  membershipSettings: MembershipSettings;
  notificationSettings: NotificationSettings;
  paymentSettings: PaymentSettings;
}
```

## List Gyms

```typescript
// List all gyms (admin only)
const { data: gyms, meta } = await sdk.gyms.list({
  page: 1,
  limit: 20,
  search: 'fitness',
  isActive: true
});

// List user's gyms
const userGyms = await sdk.gyms.getUserGyms();
```

## Get Gym

```typescript
// Get by ID
const gym = await sdk.gyms.getById('gym-uuid');

// Get by slug
const gym = await sdk.gyms.getBySlug('my-gym');

// Get current gym context
const currentGym = await sdk.gyms.getCurrentGym();
```

## Create Gym

```typescript
const newGym = await sdk.gyms.create({
  name: 'Fitness Plus',
  email: 'info@fitnessplus.com',
  phoneNumber: '+1234567890',
  address: '123 Main St',
  city: 'New York',
  state: 'NY',
  zipCode: '10001',
  country: 'US',
  timezone: 'America/New_York',
  currency: 'USD',
  settings: {
    businessHours: {
      monday: { open: '06:00', close: '22:00' },
      tuesday: { open: '06:00', close: '22:00' },
      // ... other days
    }
  }
});
```

## Update Gym

```typescript
const updatedGym = await sdk.gyms.update('gym-uuid', {
  name: 'Fitness Plus Pro',
  website: 'https://fitnesspluspr.com',
  description: 'Premium fitness facility',
  logo: 'https://example.com/logo.png'
});
```

## Gym Settings

```typescript
// Get settings
const settings = await sdk.gyms.getSettings('gym-uuid');

// Update settings
await sdk.gyms.updateSettings('gym-uuid', {
  businessHours: {
    saturday: { open: '08:00', close: '20:00' },
    sunday: { open: '08:00', close: '18:00' }
  },
  membershipSettings: {
    allowOnlineSignup: true,
    requireEmailVerification: true,
    defaultMembershipDuration: 30,
    gracePeriodDays: 7
  },
  notificationSettings: {
    emailNotifications: true,
    smsNotifications: false,
    membershipExpiry: {
      enabled: true,
      daysBefore: [7, 3, 1]
    }
  }
});
```

## Gym Features

```typescript
// Get enabled features
const features = await sdk.gyms.getFeatures('gym-uuid');

// Enable features
await sdk.gyms.enableFeatures('gym-uuid', [
  'CLASS_BOOKING',
  'PERSONAL_TRAINING',
  'NUTRITION_TRACKING'
]);

// Disable features
await sdk.gyms.disableFeatures('gym-uuid', ['NUTRITION_TRACKING']);

// Check if feature is enabled
const hasFeature = await sdk.gyms.hasFeature('gym-uuid', 'CLASS_BOOKING');
```

## Business Hours

```typescript
// Get business hours
const hours = await sdk.gyms.getBusinessHours('gym-uuid');

// Update business hours
await sdk.gyms.updateBusinessHours('gym-uuid', {
  monday: { open: '05:30', close: '23:00' },
  tuesday: { open: '05:30', close: '23:00' },
  wednesday: { open: '05:30', close: '23:00' },
  thursday: { open: '05:30', close: '23:00' },
  friday: { open: '05:30', close: '22:00' },
  saturday: { open: '07:00', close: '20:00' },
  sunday: { open: '08:00', close: '18:00' }
});

// Check if gym is open
const isOpen = await sdk.gyms.isOpen('gym-uuid');
const isOpenAt = await sdk.gyms.isOpenAt('gym-uuid', new Date('2024-01-15 14:00'));
```

## Gym Statistics

```typescript
// Get gym statistics
const stats = await sdk.gyms.getStatistics('gym-uuid', {
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31')
});

console.log(stats);
// {
//   totalMembers: 1250,
//   activeMembers: 980,
//   newMembersThisMonth: 45,
//   revenue: { total: 125000, monthly: 10416.67 },
//   checkIns: { total: 15000, daily: 41 }
// }

// Get member growth
const growth = await sdk.gyms.getMemberGrowth('gym-uuid', {
  period: 'monthly',
  months: 12
});
```

## Gym Staff

```typescript
// Get gym staff
const staff = await sdk.gyms.getStaff('gym-uuid', {
  role: 'trainer',
  isActive: true
});

// Add staff member
await sdk.gyms.addStaff('gym-uuid', {
  userId: 'user-uuid',
  role: 'trainer',
  permissions: ['CLASSES_MANAGE', 'MEMBERS_VIEW']
});

// Remove staff member
await sdk.gyms.removeStaff('gym-uuid', 'user-uuid');
```

## Gym Status

```typescript
// Activate gym
await sdk.gyms.activate('gym-uuid');

// Deactivate gym
await sdk.gyms.deactivate('gym-uuid');

// Delete gym (soft delete)
await sdk.gyms.delete('gym-uuid');

// Restore deleted gym
await sdk.gyms.restore('gym-uuid');
```

## Gym Branches

```typescript
// List gym branches
const branches = await sdk.gyms.getBranches('parent-gym-uuid');

// Create branch
const branch = await sdk.gyms.createBranch('parent-gym-uuid', {
  name: 'Fitness Plus Downtown',
  address: '456 Downtown Ave',
  // ... other details
});

// Link existing gym as branch
await sdk.gyms.linkBranch('parent-gym-uuid', 'branch-gym-uuid');
```