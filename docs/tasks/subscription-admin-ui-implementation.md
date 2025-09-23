# Subscription Administration UI Implementation

## Task Overview

Create a comprehensive subscription administration UI for super admins to manage subscription plans and organization subscriptions. The implementation will follow the established frontend patterns and maintain single responsibility principles with dedicated modals for specific actions.

## Architecture Analysis Summary

Based on analysis of the existing codebase, the frontend follows these established patterns:
- **Feature-based architecture** at `packages/web/src/features/`
- **TanStack Query** for data fetching with individual hooks per query/mutation
- **GenericTable component** with column definitions and actions
- **Modal/Dialog pattern** using Radix UI from shadcn/ui
- **React Hook Form** with Zod validation for forms
- **Single responsibility** components with proper state isolation

## Implementation Requirements

### 1. Subscription Plans Management Feature

**Location**: `packages/web/src/features/subscription-plans/`

#### File Structure
```
features/subscription-plans/
├── SubscriptionPlansList.tsx          # Main list component
├── SubscriptionPlanDetails.tsx        # View details modal
├── SubscriptionPlanForm.tsx           # Create/Edit form modal
├── components/
│   ├── SubscriptionPlanTable.tsx      # Table component
│   ├── PricingDisplay.tsx             # Multi-currency pricing display
│   └── PlanFeaturesList.tsx           # Features display component
└── hooks/
    ├── useSubscriptionPlans.ts        # List plans query
    ├── useSubscriptionPlan.ts         # Single plan query
    ├── useCreateSubscriptionPlan.ts   # Create mutation
    ├── useUpdateSubscriptionPlan.ts   # Update mutation
    └── useDeleteSubscriptionPlan.ts   # Delete mutation
```

#### SubscriptionPlansList Component Specifications

**Base Pattern**: Follow `ListOrganizations.tsx` structure

**Key Features**:
- Local search functionality (no server-side filtering)
- No pagination (display all plans)
- Sort functionality for name, pricing, creation date
- Actions dropdown: View, Edit, Delete
- Create new plan button
- Refresh functionality

**Table Columns**:
1. **Plan Name** - Display with active/inactive badge
2. **Pricing** - Multi-currency display (PEN primary, others secondary)
3. **Limits** - Gyms, Clients per Gym, Users per Gym in compact format
4. **Features** - Key features as badges (prioritySupport, etc.)
5. **Active Subscriptions** - Count of organizations using this plan
6. **Created Date** - Formatted date with tooltip
7. **Actions** - Dropdown menu

**Search Implementation**:
```typescript
const [searchTerm, setSearchTerm] = useState('');

const filteredData = useMemo(() => {
  if (!searchTerm.trim()) return sortedData;

  return sortedData.filter(plan =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [sortedData, searchTerm]);
```

**Pricing Display Component**:
```typescript
// PricingDisplay.tsx
interface PricingDisplayProps {
  pricing: {
    PEN?: { currency: 'PEN'; value: number };
    USD?: { currency: 'USD'; value: number };
    COP?: { currency: 'COP'; value: number };
    MXN?: { currency: 'MXN'; value: number };
  };
  compact?: boolean;
}

// Show PEN prominently, others as secondary info
// Handle free plans (value: 0) with special styling
```

#### SubscriptionPlanForm Component Specifications

**Modal Pattern**: Use Dialog from shadcn/ui
**Validation**: Zod schema with react-hook-form
**Responsibility**: Handle both create and edit modes

**Form Fields**:
1. **Basic Information**
   - Plan name (required)
   - Description (optional)
   - Active status toggle

2. **Pricing Section**
   - Peru (PEN) pricing (required, primary)
   - Additional currency tabs (USD, COP, MXN) - initially disabled
   - Billing frequency select (monthly, quarterly, yearly)

3. **Plan Limits**
   - Maximum gyms (number input)
   - Maximum clients per gym (number input)
   - Maximum users per gym (number input)

4. **Features Configuration**
   - Priority support toggle
   - Custom features as key-value pairs (dynamic)

**Validation Schema**:
```typescript
const subscriptionPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required").max(100),
  description: z.string().optional(),
  pricing: z.object({
    PEN: z.object({
      currency: z.literal('PEN'),
      value: z.number().min(0, "Price must be positive")
    })
  }),
  billingFrequency: z.enum(['monthly', 'quarterly', 'yearly']),
  maxGyms: z.number().min(1, "Must allow at least 1 gym"),
  maxClientsPerGym: z.number().min(1, "Must allow at least 1 client"),
  maxUsersPerGym: z.number().min(1, "Must allow at least 1 user"),
  features: z.object({
    prioritySupport: z.boolean(),
  }),
  isActive: z.boolean()
});
```

**Modal Structure**:
```typescript
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>
        {plan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
      </DialogTitle>
      <DialogDescription>
        Configure subscription plan settings, pricing, and limits
      </DialogDescription>
    </DialogHeader>

    <Form {...form}>
      <form className="space-y-6">
        {/* Form sections */}
      </form>
    </Form>

    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
        {plan ? 'Update Plan' : 'Create Plan'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 2. Organization Subscription Management Feature

**Location**: `packages/web/src/features/organization-subscriptions/`

#### File Structure
```
features/organization-subscriptions/
├── OrganizationSubscriptionsList.tsx     # Main list component
├── OrganizationSubscriptionDetails.tsx   # Details modal
├── components/
│   ├── OrganizationSubscriptionTable.tsx # Table component
│   ├── SubscriptionStatusBadge.tsx       # Status display
│   ├── SubscriptionUpgradeModal.tsx      # Upgrade modal
│   ├── SubscriptionRenewalModal.tsx      # Renewal modal
│   ├── SubscriptionCancelModal.tsx       # Cancellation modal
│   └── SubscriptionHistoryModal.tsx      # History modal
└── hooks/
    ├── useOrganizationSubscriptions.ts   # Enhanced organizations query
    ├── useSubscriptionUpgrade.ts         # Upgrade mutation
    ├── useSubscriptionRenewal.ts         # Renewal mutation
    ├── useSubscriptionCancel.ts          # Cancel mutation
    └── useSubscriptionHistory.ts         # History query
```

#### OrganizationSubscriptionsList Component Specifications

**Base Pattern**: Enhanced version of `ListOrganizations.tsx`

**Key Features**:
- Display organizations with subscription information
- Filter by subscription status (active, expired, expiring soon)
- Search by organization name or owner
- Sort functionality
- Click on organization row to navigate to details page

**Navigation Pattern**:
```typescript
// Table row click handler
const handleRowClick = (organization: OrganizationWithDetails) => {
  router.push(`/organization-subscriptions/${organization.id}`);
};

// In table component
<GenericTable
  data={filteredData}
  columns={columns}
  onRowClick={handleRowClick}
  // ... other props
/>
```

**Table Columns**:
1. **Organization** - Name with building icon (clickable row for navigation)
2. **Owner** - Name and email
3. **Current Plan** - Plan name with pricing
4. **Subscription Status** - Badge with status and expiration info
5. **Usage** - Current vs limits (gyms, clients, users)
6. **Actions** - Quick actions dropdown (Upgrade, Renew, Cancel, History)

**Status Badge Component**:
```typescript
// SubscriptionStatusBadge.tsx
interface SubscriptionStatusBadgeProps {
  status: 'active' | 'expired' | 'expiring_soon' | 'inactive';
  endDate: Date;
  daysRemaining?: number;
}

// Show different colors and icons based on status
// Display days remaining for active subscriptions
// Show "Expired" with red badge for expired
```

**Usage Display Component**:
```typescript
// UsageDisplay.tsx
interface UsageDisplayProps {
  usage: {
    gyms: number;
    totalClients: number;
    totalUsers: number;
  };
  limits: {
    maxGyms: number;
    maxClientsPerGym: number;
    maxUsersPerGym: number;
  };
}

// Show progress indicators or fraction display
// Highlight when approaching or exceeding limits
```

#### OrganizationSubscriptionDetails Component Specifications

**Navigation**: Click on any organization row navigates to dedicated route
**Route**: `/organization-subscriptions/[organizationId]`
**Pattern**: Full page layout with comprehensive information
**Responsibility**: Display all organization and subscription details

**Page Sections**:

1. **Page Header**
   - Breadcrumb navigation (Organization Subscriptions > Organization Name)
   - Organization name and back button
   - Quick action buttons (Upgrade, Renew, Cancel)

2. **Organization Information Card**
   - Organization name and creation date
   - Owner details (name, email, contact info)
   - Gym locations summary with addresses

3. **Current Subscription Card**
   - Plan name and description
   - Pricing information (multi-currency)
   - Start and end dates with visual timeline
   - Status with visual indicators and alerts

4. **Usage Statistics Card**
   - Current usage vs limits with progress bars
   - Per-gym breakdown in expandable sections
   - Usage trends and warnings if approaching limits

5. **Subscription History Card**
   - Recent subscription changes
   - Timeline of plan transitions
   - Link to full history modal

6. **Quick Actions Section**
   - Primary CTA buttons for common actions
   - Each button opens its respective modal

**Page Structure**:
```typescript
// app/organization-subscriptions/[organizationId]/page.tsx
export default function OrganizationSubscriptionDetailsPage({
  params
}: {
  params: { organizationId: string }
}) {
  return <OrganizationSubscriptionDetails organizationId={params.organizationId} />;
}

// OrganizationSubscriptionDetails.tsx
<div className="min-h-screen bg-gray-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Breadcrumb */}
    <nav className="mb-6">
      <Breadcrumb>
        <BreadcrumbItem>
          <Link href="/organization-subscriptions">Organization Subscriptions</Link>
        </BreadcrumbItem>
        <BreadcrumbItem>{organization?.name}</BreadcrumbItem>
      </Breadcrumb>
    </nav>

    {/* Page Header */}
    <div className="flex justify-between items-center mb-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeftIcon className="size-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">{organization?.name}</h1>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => setUpgradeModalOpen(true)}>
          Upgrade Plan
        </Button>
        <Button variant="outline" onClick={() => setRenewModalOpen(true)}>
          Renew
        </Button>
      </div>
    </div>

    {/* Content Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Organization Info Card */}
      {/* Subscription Info Card */}
      {/* Usage Statistics Card */}
      {/* Recent History Card */}
    </div>

    {/* Action Modals */}
    <SubscriptionUpgradeModal
      organizationId={organizationId}
      isOpen={upgradeModalOpen}
      onOpenChange={setUpgradeModalOpen}
    />
    {/* Other modals */}
  </div>
</div>
```

### 3. Subscription Action Modals

#### SubscriptionUpgradeModal Specifications

**Trigger**: Upgrade button in organization details
**Props**: Only organization ID
**Responsibility**: Handle complete upgrade flow

**Modal Features**:
- Fetch available plans internally
- Display current plan vs available plans
- Plan comparison table
- Upgrade confirmation with impact analysis
- Handle upgrade API call and success/error states

**Flow**:
1. Show current plan details
2. Display available upgrade options
3. Plan selection with comparison
4. Confirmation step with impact summary
5. Processing and success feedback

#### SubscriptionRenewalModal Specifications

**Props**: Organization ID
**Features**:
- Current subscription details
- Renewal period selection (use current plan duration or custom)
- Plan change option during renewal
- Cost calculation and display
- Confirmation and processing

#### SubscriptionCancelModal Specifications

**Props**: Organization ID
**Features**:
- Current subscription impact warning
- Cancellation reason selection (required)
- Immediate vs end-of-period cancellation options
- Data retention information
- Confirmation with impact summary

#### SubscriptionHistoryModal Specifications

**Props**: Organization ID
**Features**:
- Timeline view of all subscription changes
- Plan transitions with dates
- Cancellation and renewal history
- Payment history (if available)
- Export functionality

### 4. Data Fetching Hooks

#### Query Hooks Pattern

**useSubscriptionPlans.ts**:
```typescript
export function useSubscriptionPlans() {
  const { sdk } = useGymSdk();

  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      return await sdk.subscriptionPlans.listPlans();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
```

**useOrganizationSubscriptions.ts**:
```typescript
export function useOrganizationSubscriptions() {
  const { sdk } = useGymSdk();

  return useQuery({
    queryKey: ['organization-subscriptions'],
    queryFn: async () => {
      const result = await sdk.organizations.listOrganizations();
      return result; // Enhanced with subscription data
    },
    staleTime: 2 * 60 * 1000, // More frequent updates
  });
}
```

#### Mutation Hooks Pattern

**useCreateSubscriptionPlan.ts**:
```typescript
export function useCreateSubscriptionPlan() {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSubscriptionPlanDto) => {
      return await sdk.subscriptionPlans.createPlan(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Subscription plan created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create subscription plan');
    },
  });
}
```

### 5. Routing Structure

**App Router Configuration**:
```
app/
├── subscription-plans/
│   └── page.tsx                    # Plans management page
├── organization-subscriptions/
│   ├── page.tsx                    # Organization subscriptions list page
│   └── [organizationId]/
│       └── page.tsx                # Organization subscription details page
└── layout.tsx                      # Root layout
```

**Page Components**:
```typescript
// app/subscription-plans/page.tsx
export default function SubscriptionPlansPage() {
  return <SubscriptionPlansList />;
}

// app/organization-subscriptions/page.tsx
export default function OrganizationSubscriptionsPage() {
  return <OrganizationSubscriptionsList />;
}

// app/organization-subscriptions/[organizationId]/page.tsx
export default function OrganizationSubscriptionDetailsPage({
  params
}: {
  params: { organizationId: string }
}) {
  return <OrganizationSubscriptionDetails organizationId={params.organizationId} />;
}
```

### 6. Type Definitions

**Import SDK Types**:
```typescript
// Use existing SDK types, don't duplicate
import {
  SubscriptionPlanDto,
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
  AdminSubscriptionStatusDto,
  ActivateRenewalDto,
  CancelSubscriptionDto,
  UpgradeSubscriptionDto,
  SubscriptionHistoryDto,
} from '@gymspace/sdk';
```

**Component-Specific Types**:
```typescript
// Local UI state types only
interface SubscriptionPlanTableProps {
  plans: SubscriptionPlanDto[];
  onView: (plan: SubscriptionPlanDto) => void;
  onEdit: (plan: SubscriptionPlanDto) => void;
  onDelete: (planId: string) => void;
}

interface OrganizationSubscriptionFilters {
  status: 'all' | 'active' | 'expired' | 'expiring_soon' | 'inactive';
  search: string;
}
```

### 7. Navigation Integration

**Navigation Menu Updates**:
Add subscription management items to the admin navigation (if it exists) or create dedicated admin routes.


### 8. Error Handling Patterns

**Query Error Handling**:
```typescript
const { data, isLoading, error } = useSubscriptionPlans();

if (error) {
  return (
    <ErrorState
      error={error}
      icon={CreditCardIcon}
      onRetry={() => refetch()}
    />
  );
}
```

**Mutation Error Handling**:
```typescript
const mutation = useCreateSubscriptionPlan();

const handleSubmit = async (data: CreateSubscriptionPlanDto) => {
  try {
    await mutation.mutateAsync(data);
    setIsOpen(false);
    form.reset();
  } catch (error) {
    // Error is automatically handled by the mutation hook
    console.error('Form submission error:', error);
  }
};
```

### 9. Loading States

**Table Loading**:
```typescript
<GenericTable
  data={data}
  columns={columns}
  loading={isLoading}
  loadingState={<TableSkeleton rows={5} columns={6} />}
  // ... other props
/>
```

**Modal Loading**:
```typescript
<Button onClick={handleSubmit} disabled={isSubmitting}>
  {isSubmitting && <Loader2Icon className="size-4 mr-2 animate-spin" />}
  {isSubmitting ? 'Creating...' : 'Create Plan'}
</Button>
```

### 10. Desktop-First Design

**Layout Considerations**:
- Designed primarily for desktop administration
- Fixed table layouts with all columns visible
- Standard modal sizes optimized for desktop screens
- Mouse-based interaction patterns

## Implementation Priority

### Phase 1: Subscription Plans Management
1. Create SubscriptionPlansList component with table
2. Implement SubscriptionPlanForm modal for create/edit
3. Add search and sorting functionality
4. Create all necessary hooks for plans CRUD

### Phase 2: Organization Subscription Views
1. Create OrganizationSubscriptionsList component
2. Implement OrganizationSubscriptionDetails modal
3. Add filtering and search for organizations
4. Create subscription status display components

### Phase 3: Subscription Action Modals
1. Implement SubscriptionUpgradeModal
2. Create SubscriptionRenewalModal
3. Add SubscriptionCancelModal
4. Implement SubscriptionHistoryModal

### Phase 4: Integration and Polish
1. Add routing and navigation
2. Add comprehensive error handling
3. Desktop layout optimization

## Quality Standards

- **Type Safety**: Use SDK types exclusively, no duplication
- **Single Responsibility**: Each modal handles one specific action
- **Error Handling**: Comprehensive error states and user feedback
- **Loading States**: Proper loading indicators for all async operations
- **Desktop Optimization**: Clean layouts optimized for desktop administration
- **Performance**: React.memo and useMemo for expensive operations
- **User Experience**: Clear feedback, confirmations, and success states

## Success Criteria

1. Super admins can create, edit, and delete subscription plans
2. Plan pricing supports Peru (PEN) currency with structure for expansion
3. Organizations list shows subscription status and usage information
4. Clicking on organization subscription shows detailed information
5. Upgrade modal is self-contained and handles complete upgrade flow
6. All modals follow single responsibility principle
7. Tables support local search and sorting without pagination
8. UI follows established design patterns and component library
9. Error states are handled gracefully with user-friendly messages
10. All functionality works optimally on desktop screens