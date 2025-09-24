# Task: Display Days Remaining Until Membership Expiration in Mobile App

## Context
Currently, the mobile app displays "PLAN ACTIVO" for clients with active memberships. This provides limited information to administrators who need to know how many days remain until a membership expires to take timely action (renewals, follow-ups, etc.).

## Current State Analysis

### Problem Identification
1. **Limited Information**: The current "PLAN ACTIVO" badge only indicates that a client has some contract, not whether it's actually valid or about to expire
2. **Incorrect Logic**: Badge displays based on contract existence (`client.contracts.length > 0`) rather than contract validity
3. **No Expiration Visibility**: Administrators cannot see upcoming expirations without navigating to individual client details

### Current Implementation Details
- **Location**: `packages/mobile/src/shared/components/ClientCard.tsx` (lines 152-159)
- **Current Logic**: Shows badge if `client.contracts` exists and `client.status === 'active'`
- **Missing Validations**:
  - No contract status check (`contract.status`)
  - No date comparison with current date
  - No handling of frozen contracts

### Available Data from API
✅ **VERIFIED: Backend implementation is complete and functional**

When `includeContractStatus=true` is passed to `searchClients`:
```typescript
contracts: [{
  id: string,
  status: string, // 'active', 'expiring_soon', 'expired', etc.
  startDate: string, // ISO date
  endDate: string,   // ISO date
  gymMembershipPlan: { id: string, name: string }
}]
```

**Important**: The backend only returns ONE contract (the one with the latest end date) when using the search endpoint.

## Proposed Solution

### Display Logic
Replace the static "PLAN ACTIVO" badge with dynamic information:

1. **No Active Contract**: No badge displayed
2. **Expired**: Red badge showing "EXPIRADO"
3. **Expiring Soon (≤7 days)**: Orange/warning badge showing "VENCE EN X DÍAS"
4. **Active (>7 days)**: Green badge showing "ACTIVO - X DÍAS"
5. **Frozen Contract**: Blue badge showing "CONGELADO"

### Implementation Requirements

#### 1. Enable Contract Data Fetching
**File**: `packages/mobile/src/features/clients/components/ClientsList.tsx`
- Modify the `useClientsList` hook call to include `includeContractStatus: true`
```typescript
const { data, isLoading, refetch } = useClientsList({
  search,
  activeOnly: false,
  includeContractStatus: true  // ← Add this parameter
});
```

#### 2. Create Date Utility Function
**New File**: `packages/mobile/src/utils/contract-utils.ts`
```typescript
export const calculateDaysRemaining = (endDate: string): number => {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

export const getActiveContract = (contracts: Contract[]): Contract | null => {
  if (!contracts || contracts.length === 0) return null;

  // Find the most recent active contract
  return contracts
    .filter(c => c.status === 'active' || c.status === 'expiring_soon')
    .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
    [0] || null;
};
```

#### 3. Create Contract Status Badge Component
**New File**: `packages/mobile/src/shared/components/ContractStatusBadge.tsx`
```typescript
interface ContractStatusBadgeProps {
  contracts?: Array<{
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    freezeStartDate?: string;
    freezeEndDate?: string;
  }>;
}
```

Badge variations:
- **Expired**: `variant="outline" action="error"` → "EXPIRADO"
- **Expiring Soon**: `variant="solid" action="warning"` → "VENCE EN {days} DÍAS"
- **Active**: `variant="outline" action="success"` → "{days} DÍAS"
- **Frozen**: `variant="outline" action="info"` → "CONGELADO"

#### 4. Update ClientCard Component
**File**: `packages/mobile/src/shared/components/ClientCard.tsx`
- Replace lines 152-159 with the new `ContractStatusBadge` component
- Import and use the new component: `<ContractStatusBadge contracts={client.contracts} />`

### Visual Design Specifications

#### Badge Colors and Styles
- **Expired**: Red text/border (`action="error"`)
- **Expiring (1-3 days)**: Solid orange background (`variant="solid" action="warning"`)
- **Expiring (4-7 days)**: Orange outline (`variant="outline" action="warning"`)
- **Active (8-30 days)**: Green outline with days count (`variant="outline" action="success"`)
- **Active (>30 days)**: Muted green outline (`variant="outline" action="info"`)

#### Text Display Format
- ≤3 days: "VENCE EN {X} DÍAS" (prominent warning)
- 4-7 days: "VENCE EN {X} DÍAS"
- 8-30 days: "{X} DÍAS"
- >30 days: "{X} DÍAS" or "ACTIVO"

## Implementation Steps

1. **Step 1**: Create utility functions for date calculations in `contract-utils.ts`
2. **Step 2**: Create ContractStatusBadge component with all status variations
3. **Step 3**: Update ClientsList to include contract data by adding `includeContractStatus: true` to the hook
4. **Step 4**: Replace current badge implementation in ClientCard with the new component
5. **Step 5**: Test with different contract scenarios (expired, expiring soon, active, no contract)

## Edge Cases to Handle

1. **Multiple Contracts**: Show the most recent active contract
2. **Frozen Contracts**: Check `freezeStartDate` and `freezeEndDate` to determine if currently frozen
3. **Grace Period**: Contracts may still be usable during grace period (3 days after expiration)
4. **No Contracts**: Don't show any badge
5. **All Expired**: Show "SIN PLAN" or no badge

## Dependencies

- Use existing `dayjs` or `date-fns` for date calculations (already in package.json)
- Use existing Badge component from `@/components/ui/badge`
- Use existing color scheme and design system

## Success Criteria

1. ✅ Administrators can see at a glance how many days remain for each client's membership
2. ✅ Visual urgency indicators for expiring memberships (color coding)
3. ✅ Accurate calculation considering contract dates and current date
4. ✅ Proper handling of edge cases (no contract, expired, frozen)
5. ✅ Performance: No additional API calls, uses existing data

## Files to Modify

### Mobile App Changes Only
1. `packages/mobile/src/features/clients/components/ClientsList.tsx` - Add `includeContractStatus: true` parameter
2. `packages/mobile/src/shared/components/ClientCard.tsx` - Replace badge logic with new component
3. **NEW**: `packages/mobile/src/utils/contract-utils.ts` - Date calculation utilities
4. **NEW**: `packages/mobile/src/shared/components/ContractStatusBadge.tsx` - Badge component

### No Backend Changes Required
✅ The backend already supports `includeContractStatus` parameter - verified and functional

## Notes

- This change only affects the mobile app, not the web application
- Uses existing API data, no backend changes required
- Follows existing design patterns and component library