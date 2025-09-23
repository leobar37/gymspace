# Organization Subscriptions Feature

## Phase 2 Implementation Complete

This feature provides comprehensive subscription management for super admins to monitor and manage organization subscriptions.

## Components Created

### Main Components
- **OrganizationSubscriptionsList.tsx** - Main list component with filtering, search, and stats
- **OrganizationSubscriptionTable.tsx** - Table component with clickable rows for navigation

### UI Components
- **SubscriptionStatusBadge.tsx** - Visual status indicators (active, expired, expiring_soon, inactive)
- **UsageDisplay.tsx** - Usage visualization with progress bars and warnings

### Hooks
- **useOrganizationSubscriptions.ts** - Data fetching hook with subscription status categorization

## Features Implemented

✅ **Enhanced organization list** with subscription data
✅ **Status filtering** (all, active, expired, expiring_soon, inactive)
✅ **Search functionality** by organization name, owner, or plan
✅ **Sorting** for all columns
✅ **Status badges** with color coding and expiration info
✅ **Usage display** showing current usage vs limits
✅ **Statistics cards** showing counts by status
✅ **Clickable rows** for navigation to details page
✅ **Action dropdown** with placeholder handlers for Phase 3

## Usage

```tsx
import { OrganizationSubscriptionsList } from '@/features/organization-subscriptions';

// In your page component
export default function OrganizationSubscriptionsPage() {
  return <OrganizationSubscriptionsList />;
}
```

## Routes

- `/organization-subscriptions` - Main list page
- `/organization-subscriptions/[organizationId]` - Details page (placeholder for Phase 3)

## Status Categorization

- **Active**: Subscription is active and not expiring soon
- **Expiring Soon**: Active but expiring within 30 days
- **Expired**: Subscription has expired
- **Inactive**: No active subscription

## Next Steps (Phase 3)

The following components will be implemented in Phase 3:
- OrganizationSubscriptionDetails page with full information
- SubscriptionUpgradeModal
- SubscriptionRenewalModal
- SubscriptionCancelModal
- SubscriptionHistoryModal

## API Integration

The component uses the SDK's `organizations.listOrganizations()` endpoint which returns enhanced data including:
- Organization details
- Owner information
- Gym list
- Subscription status and plan details
- Usage statistics