# Member Management

The Members module provides comprehensive member profile management, including registration, contracts, and access control.

## Member Object

```typescript
interface Member {
  id: string;
  clientNumber: string;
  userId: string;
  gymId: string;
  personalInfo: PersonalInfo;
  contactInfo: ContactInfo;
  emergencyContact: EmergencyContact;
  healthInfo?: HealthInfo;
  preferences?: MemberPreferences;
  status: 'active' | 'inactive' | 'suspended';
  joinedAt: Date;
  lastVisitAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface PersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender?: 'male' | 'female' | 'other';
  nationalId?: string;
}

interface ContactInfo {
  email: string;
  phoneNumber: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}
```

## List Members

```typescript
// List all members
const { data: members, meta } = await sdk.members.list({
  page: 1,
  limit: 20,
  search: 'john',
  status: 'active',
  orderBy: 'joinedAt',
  order: 'desc'
});

// Search members
const results = await sdk.members.search({
  query: 'john',
  filters: {
    status: ['active', 'inactive'],
    joinedAfter: new Date('2024-01-01'),
    hasActiveContract: true,
    tags: ['vip', 'personal-training']
  }
});
```

## Get Member

```typescript
// Get by ID
const member = await sdk.members.getById('member-uuid');

// Get by client number
const member = await sdk.members.getByClientNumber('M-20240001');

// Get member with related data
const memberFull = await sdk.members.getById('member-uuid', {
  include: ['contracts', 'checkIns', 'payments']
});
```

## Create Member

```typescript
const newMember = await sdk.members.create({
  personalInfo: {
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: new Date('1990-01-15'),
    gender: 'male'
  },
  contactInfo: {
    email: 'john.doe@example.com',
    phoneNumber: '+1234567890',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001'
  },
  emergencyContact: {
    name: 'Jane Doe',
    relationship: 'spouse',
    phoneNumber: '+0987654321'
  },
  createUser: true, // Create associated user account
  sendWelcomeEmail: true
});
```

## Update Member

```typescript
const updatedMember = await sdk.members.update('member-uuid', {
  personalInfo: {
    firstName: 'Jonathan'
  },
  contactInfo: {
    phoneNumber: '+1122334455'
  },
  preferences: {
    communicationPreferences: {
      email: true,
      sms: false,
      push: true
    },
    trainingPreferences: {
      preferredTime: 'morning',
      goals: ['weight-loss', 'muscle-gain']
    }
  }
});
```

## Member Status

```typescript
// Activate member
await sdk.members.activate('member-uuid');

// Suspend member
await sdk.members.suspend('member-uuid', {
  reason: 'Payment overdue',
  suspendedUntil: new Date('2024-02-01')
});

// Deactivate member
await sdk.members.deactivate('member-uuid');

// Reactivate member
await sdk.members.reactivate('member-uuid');
```

## Member Contracts

```typescript
// Get member contracts
const contracts = await sdk.members.getContracts('member-uuid', {
  status: 'active'
});

// Get active contract
const activeContract = await sdk.members.getActiveContract('member-uuid');

// Create contract for member
const contract = await sdk.members.createContract('member-uuid', {
  planId: 'plan-uuid',
  startDate: new Date(),
  paymentMethod: 'credit_card',
  autoRenew: true
});
```

## Check-ins

```typescript
// Record check-in
const checkIn = await sdk.members.checkIn('member-uuid', {
  method: 'qr_code',
  location: 'main-entrance'
});

// Get check-in history
const checkIns = await sdk.members.getCheckIns('member-uuid', {
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  limit: 100
});

// Get check-in statistics
const stats = await sdk.members.getCheckInStats('member-uuid', {
  period: 'monthly'
});
```

## Member Health Information

```typescript
// Update health info
await sdk.members.updateHealthInfo('member-uuid', {
  bloodType: 'O+',
  allergies: ['peanuts'],
  medicalConditions: ['asthma'],
  medications: ['inhaler'],
  emergencyNotes: 'Carries EpiPen'
});

// Get health info
const healthInfo = await sdk.members.getHealthInfo('member-uuid');
```

## Member Documents

```typescript
// Upload document
const document = await sdk.members.uploadDocument('member-uuid', {
  file: fileBlob,
  type: 'medical_certificate',
  description: 'Annual health check',
  expiresAt: new Date('2025-01-15')
});

// List documents
const documents = await sdk.members.getDocuments('member-uuid');

// Download document
const fileUrl = await sdk.members.getDocumentUrl('member-uuid', 'document-uuid');
```

## Member Tags

```typescript
// Add tags
await sdk.members.addTags('member-uuid', ['vip', 'personal-training']);

// Remove tags
await sdk.members.removeTags('member-uuid', ['personal-training']);

// Get members by tag
const vipMembers = await sdk.members.getByTag('vip');
```

## Member Notes

```typescript
// Add note
await sdk.members.addNote('member-uuid', {
  content: 'Member requested special assistance with equipment',
  visibility: 'staff', // 'staff' or 'public'
  category: 'general'
});

// Get notes
const notes = await sdk.members.getNotes('member-uuid', {
  visibility: 'staff'
});
```

## Access Control

```typescript
// Get access permissions
const access = await sdk.members.getAccessPermissions('member-uuid');

// Grant temporary access
await sdk.members.grantTemporaryAccess('member-uuid', {
  areas: ['pool', 'sauna'],
  validFrom: new Date(),
  validUntil: new Date('2024-02-01')
});

// Revoke access
await sdk.members.revokeAccess('member-uuid', ['pool']);
```

## Member Analytics

```typescript
// Get member analytics
const analytics = await sdk.members.getAnalytics('member-uuid', {
  metrics: ['attendance', 'revenue', 'engagement'],
  period: 'last_year'
});

// Get workout frequency
const frequency = await sdk.members.getWorkoutFrequency('member-uuid', {
  period: 'last_3_months'
});
```