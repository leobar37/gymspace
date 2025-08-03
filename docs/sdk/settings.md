# Settings Management

The Settings module provides configuration management for gyms, users, and system-wide preferences.

## Settings Structure

```typescript
interface GymSettings {
  general: GeneralSettings;
  membership: MembershipSettings;
  billing: BillingSettings;
  notifications: NotificationSettings;
  access: AccessSettings;
  branding: BrandingSettings;
  integrations: IntegrationSettings;
  features: FeatureSettings;
}

interface UserSettings {
  preferences: UserPreferences;
  notifications: UserNotificationSettings;
  privacy: PrivacySettings;
  display: DisplaySettings;
}
```

## Gym Settings

```typescript
// Get all gym settings
const settings = await sdk.settings.getGymSettings('gym-uuid');

// Get specific setting group
const billing = await sdk.settings.getGymSettingGroup('gym-uuid', 'billing');

// Update gym settings
await sdk.settings.updateGymSettings('gym-uuid', {
  general: {
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    currency: 'USD',
    language: 'en'
  },
  membership: {
    allowOnlineSignup: true,
    requireEmailVerification: true,
    requireIdVerification: false,
    defaultMembershipDuration: 30,
    gracePeriodDays: 7,
    allowFreeze: true,
    maxFreezeDays: 30,
    minContractDuration: 1
  }
});
```

## Business Hours

```typescript
// Get business hours
const hours = await sdk.settings.getBusinessHours('gym-uuid');

// Update business hours
await sdk.settings.updateBusinessHours('gym-uuid', {
  regular: {
    monday: { open: '06:00', close: '22:00' },
    tuesday: { open: '06:00', close: '22:00' },
    wednesday: { open: '06:00', close: '22:00' },
    thursday: { open: '06:00', close: '22:00' },
    friday: { open: '06:00', close: '21:00' },
    saturday: { open: '08:00', close: '20:00' },
    sunday: { open: '08:00', close: '18:00' }
  },
  holidays: [
    {
      date: '2024-12-25',
      name: 'Christmas',
      hours: { closed: true }
    },
    {
      date: '2024-01-01',
      name: 'New Year',
      hours: { open: '10:00', close: '16:00' }
    }
  ]
});

// Add special hours
await sdk.settings.addSpecialHours('gym-uuid', {
  date: '2024-07-04',
  name: 'Independence Day',
  hours: { open: '08:00', close: '14:00' }
});
```

## Billing Settings

```typescript
// Update billing settings
await sdk.settings.updateBillingSettings('gym-uuid', {
  paymentMethods: ['credit_card', 'debit_card', 'bank_transfer'],
  defaultPaymentMethod: 'credit_card',
  taxRate: 8.5,
  taxInclusive: false,
  invoicePrefix: 'INV',
  paymentTerms: 'due_on_receipt',
  lateFeePercentage: 5,
  lateFeeGraceDays: 3,
  currency: 'USD',
  billingCycles: ['monthly', 'quarterly', 'annual'],
  prorationEnabled: true
});

// Get payment gateway settings
const gateways = await sdk.settings.getPaymentGateways('gym-uuid');

// Configure payment gateway
await sdk.settings.configurePaymentGateway('gym-uuid', {
  provider: 'stripe',
  config: {
    publishableKey: 'pk_test_...',
    secretKey: 'sk_test_...',
    webhookSecret: 'whsec_...'
  },
  isActive: true
});
```

## Notification Settings

```typescript
// Update notification settings
await sdk.settings.updateNotificationSettings('gym-uuid', {
  channels: {
    email: {
      enabled: true,
      provider: 'sendgrid',
      fromEmail: 'noreply@gym.com',
      fromName: 'Fitness Plus'
    },
    sms: {
      enabled: true,
      provider: 'twilio',
      fromNumber: '+1234567890'
    },
    push: {
      enabled: true,
      provider: 'firebase'
    }
  },
  templates: {
    memberWelcome: {
      enabled: true,
      channels: ['email', 'sms']
    },
    contractExpiry: {
      enabled: true,
      channels: ['email', 'push'],
      daysBefore: [30, 14, 7, 1]
    },
    paymentReminder: {
      enabled: true,
      channels: ['email', 'sms'],
      daysAfterDue: [1, 3, 7]
    }
  }
});
```

## Access Control Settings

```typescript
// Update access settings
await sdk.settings.updateAccessSettings('gym-uuid', {
  requireCheckIn: true,
  checkInMethods: ['qr_code', 'biometric', 'card'],
  allowMultipleCheckIns: false,
  checkInWindowMinutes: 30,
  areas: [
    {
      id: 'main-gym',
      name: 'Main Gym Floor',
      requiresSpecialAccess: false
    },
    {
      id: 'pool',
      name: 'Swimming Pool',
      requiresSpecialAccess: true,
      allowedPlans: ['premium', 'vip']
    }
  ],
  accessSchedule: {
    enforceSchedule: true,
    defaultSchedule: {
      monday: { start: '06:00', end: '22:00' },
      // ... other days
    }
  }
});
```

## Branding Settings

```typescript
// Update branding
await sdk.settings.updateBranding('gym-uuid', {
  logo: {
    light: 'https://example.com/logo-light.png',
    dark: 'https://example.com/logo-dark.png'
  },
  colors: {
    primary: '#1976d2',
    secondary: '#dc004e',
    accent: '#ffb74d',
    background: '#ffffff',
    text: '#333333'
  },
  fonts: {
    heading: 'Roboto',
    body: 'Open Sans'
  },
  emailTemplate: {
    headerImage: 'https://example.com/email-header.png',
    footerText: '© 2024 Fitness Plus. All rights reserved.'
  }
});
```

## Feature Toggles

```typescript
// Get feature flags
const features = await sdk.settings.getFeatures('gym-uuid');

// Enable/disable features
await sdk.settings.updateFeatures('gym-uuid', {
  classBooking: true,
  personalTraining: true,
  nutritionTracking: true,
  mobileApp: true,
  onlinePayments: true,
  memberReferrals: true,
  loyaltyProgram: false,
  virtualClasses: true
});

// Check if feature is enabled
const hasFeature = await sdk.settings.isFeatureEnabled(
  'gym-uuid',
  'classBooking'
);
```

## User Settings

```typescript
// Get user settings
const userSettings = await sdk.settings.getUserSettings();

// Update user preferences
await sdk.settings.updateUserPreferences({
  language: 'en',
  timezone: 'America/New_York',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  startOfWeek: 'sunday',
  theme: 'light'
});

// Update notification preferences
await sdk.settings.updateUserNotifications({
  email: {
    marketing: true,
    updates: true,
    reminders: true,
    digest: 'weekly'
  },
  push: {
    enabled: true,
    sound: true,
    vibrate: true
  },
  sms: {
    enabled: false
  }
});
```

## System Settings (Admin Only)

```typescript
// Get system settings
const system = await sdk.settings.getSystemSettings();

// Update system settings
await sdk.settings.updateSystemSettings({
  maintenance: {
    enabled: false,
    message: 'System maintenance in progress'
  },
  security: {
    passwordMinLength: 8,
    passwordRequireSpecial: true,
    sessionTimeout: 3600,
    maxLoginAttempts: 5,
    mfaRequired: false
  },
  limits: {
    maxGymsPerAccount: 10,
    maxMembersPerGym: 10000,
    maxFileSize: 10485760, // 10MB
    maxStoragePerGym: 10737418240 // 10GB
  }
});
```

## Import/Export Settings

```typescript
// Export settings
const exported = await sdk.settings.exportSettings('gym-uuid', {
  include: ['general', 'membership', 'billing'],
  format: 'json'
});

// Import settings
await sdk.settings.importSettings('gym-uuid', {
  data: exportedData,
  overwrite: true,
  validate: true
});

// Clone settings to another gym
await sdk.settings.cloneSettings({
  fromGymId: 'source-gym-uuid',
  toGymId: 'target-gym-uuid',
  sections: ['general', 'membership', 'access']
});
```