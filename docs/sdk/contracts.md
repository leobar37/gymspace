# Contract Management

The Contracts module handles membership contracts, subscriptions, billing cycles, and payment processing.

## Contract Object

```typescript
interface Contract {
  id: string;
  contractNumber: string;
  gymClientId: string;
  planId: string;
  status: 'pending' | 'active' | 'suspended' | 'cancelled' | 'expired';
  startDate: Date;
  endDate?: Date;
  billingCycle: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  price: number;
  currency: string;
  paymentMethod: 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash';
  autoRenew: boolean;
  nextBillingDate?: Date;
  cancellationReason?: string;
  cancellationDate?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface ContractPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  duration: number; // in days
  billingCycle: string;
  features: string[];
  isActive: boolean;
}
```

## List Contracts

```typescript
// List all contracts
const { data: contracts, meta } = await sdk.contracts.list({
  page: 1,
  limit: 20,
  status: 'active',
  orderBy: 'startDate',
  order: 'desc'
});

// Filter contracts
const filtered = await sdk.contracts.list({
  status: ['active', 'suspended'],
  planId: 'plan-uuid',
  expiringInDays: 30,
  autoRenew: true
});

// Search contracts
const results = await sdk.contracts.search({
  query: 'John Doe',
  includeExpired: false
});
```

## Get Contract

```typescript
// Get by ID
const contract = await sdk.contracts.getById('contract-uuid');

// Get by contract number
const contract = await sdk.contracts.getByNumber('C-20240001');

// Get with related data
const contractFull = await sdk.contracts.getById('contract-uuid', {
  include: ['member', 'plan', 'payments', 'history']
});
```

## Create Contract

```typescript
const newContract = await sdk.contracts.create({
  gymClientId: 'member-uuid',
  planId: 'plan-uuid',
  startDate: new Date(),
  paymentMethod: 'credit_card',
  autoRenew: true,
  paymentDetails: {
    cardToken: 'stripe-token-123',
    saveCard: true
  },
  discount: {
    type: 'percentage',
    value: 10,
    reason: 'New member promotion'
  }
});
```

## Update Contract

```typescript
const updated = await sdk.contracts.update('contract-uuid', {
  autoRenew: false,
  paymentMethod: 'bank_transfer',
  metadata: {
    notes: 'Customer requested to disable auto-renewal'
  }
});
```

## Contract Plans

```typescript
// List available plans
const plans = await sdk.contracts.getPlans({
  isActive: true,
  orderBy: 'price',
  order: 'asc'
});

// Get plan details
const plan = await sdk.contracts.getPlan('plan-uuid');

// Create new plan
const newPlan = await sdk.contracts.createPlan({
  name: 'Premium Monthly',
  description: 'Full access to all facilities',
  price: 99.99,
  currency: 'USD',
  duration: 30,
  billingCycle: 'monthly',
  features: [
    'Gym access',
    'Pool access',
    'Group classes',
    'Personal training session'
  ]
});

// Update plan
await sdk.contracts.updatePlan('plan-uuid', {
  price: 89.99,
  features: [...existingFeatures, 'Sauna access']
});
```

## Contract Lifecycle

```typescript
// Activate contract
await sdk.contracts.activate('contract-uuid', {
  processPayment: true
});

// Suspend contract
await sdk.contracts.suspend('contract-uuid', {
  reason: 'Payment failure',
  suspendedUntil: new Date('2024-02-01')
});

// Resume suspended contract
await sdk.contracts.resume('contract-uuid');

// Cancel contract
await sdk.contracts.cancel('contract-uuid', {
  reason: 'Member request',
  effectiveDate: new Date('2024-01-31'),
  refundRemaining: true
});

// Renew contract
const renewed = await sdk.contracts.renew('contract-uuid', {
  planId: 'new-plan-uuid', // Optional: change plan
  duration: 90, // Optional: custom duration
  processPayment: true
});
```

## Payments

```typescript
// Get contract payments
const payments = await sdk.contracts.getPayments('contract-uuid', {
  status: 'completed'
});

// Process payment
const payment = await sdk.contracts.processPayment('contract-uuid', {
  amount: 99.99,
  paymentMethod: 'credit_card',
  cardToken: 'stripe-token-123'
});

// Refund payment
const refund = await sdk.contracts.refundPayment('payment-uuid', {
  amount: 50.00, // Partial refund
  reason: 'Service not rendered'
});

// Get payment history
const history = await sdk.contracts.getPaymentHistory('contract-uuid', {
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31')
});
```

## Billing

```typescript
// Get upcoming bills
const upcomingBills = await sdk.contracts.getUpcomingBills({
  daysAhead: 30
});

// Process batch billing
const results = await sdk.contracts.processBatchBilling({
  contractIds: ['uuid1', 'uuid2', 'uuid3'],
  billingDate: new Date()
});

// Update billing information
await sdk.contracts.updateBillingInfo('contract-uuid', {
  paymentMethod: 'credit_card',
  cardDetails: {
    token: 'new-stripe-token',
    last4: '4242',
    expiryMonth: 12,
    expiryYear: 2025
  }
});
```

## Contract Amendments

```typescript
// Add amendment
const amendment = await sdk.contracts.addAmendment('contract-uuid', {
  type: 'price_change',
  description: 'Loyalty discount applied',
  changes: {
    price: { from: 99.99, to: 79.99 }
  },
  effectiveDate: new Date('2024-02-01')
});

// Get amendments
const amendments = await sdk.contracts.getAmendments('contract-uuid');
```

## Contract Analytics

```typescript
// Get contract statistics
const stats = await sdk.contracts.getStatistics({
  period: 'monthly',
  metrics: ['new', 'renewals', 'cancellations', 'revenue']
});

// Get retention metrics
const retention = await sdk.contracts.getRetentionMetrics({
  cohort: 'monthly',
  months: 12
});

// Get revenue forecast
const forecast = await sdk.contracts.getRevenueForecast({
  months: 6,
  includeChurn: true
});
```

## Bulk Operations

```typescript
// Bulk suspend contracts
await sdk.contracts.bulkSuspend({
  contractIds: ['uuid1', 'uuid2'],
  reason: 'Seasonal closure'
});

// Bulk renewal
const renewals = await sdk.contracts.bulkRenew({
  contractIds: ['uuid1', 'uuid2', 'uuid3'],
  extendByDays: 30
});
```