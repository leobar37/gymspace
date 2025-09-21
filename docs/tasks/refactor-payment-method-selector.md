# PaymentMethodSelectorField Refactoring Analysis

## Current Problem

The `PaymentMethodSelectorField` component uses global state management via Zustand stores, causing a critical issue where **all rendered selectors open simultaneously** when any one is triggered. This happens because:

1. **Global State Issue**: `usePaymentMethodSelectorStore` is a global singleton
2. **Shared Modal State**: `usePaymentMethodMainModal` and `usePaymentMethodDetailsModal` are global disclosure stores
3. **Multiple Instances**: When multiple `PaymentMethodSelectorField` components exist on the same screen, they all share the same global state

## Current Architecture Analysis

### Current Implementation Structure

```
PaymentMethodSelectorField.tsx (Lines 19-269)
├── Global Stores (Problematic)
│   ├── usePaymentMethodSelectorStore() - Global business logic state
│   ├── usePaymentMethodMainModal() - Global main modal disclosure
│   └── usePaymentMethodDetailsModal() - Global details modal disclosure
├── Custom Modal Implementation
│   ├── React Native Modal (Line 216-259)
│   ├── PaymentMethodModalHeader
│   ├── PaymentMethodSearchBar
│   ├── PaymentMethodsListContainer
│   └── PaymentMethodModalFooter
└── Secondary Modal
    └── PaymentMethodDetailsModal (Line 261-266)
```

### Global State Structure (payment-method-selector.store.ts)

```typescript
// Business Logic State (Lines 7-12)
interface PaymentMethodSelectorState {
  searchQuery: string;           // Shared across all instances ❌
  tempValue: string;            // Shared across all instances ❌
  selectedPaymentMethod: PaymentMethod | null;  // Shared ❌
  detailsPaymentMethod: PaymentMethod | null;   // Shared ❌
}

// Global Disclosure Stores (Lines 101-102)
usePaymentMethodMainModal = createDisclosureStore();    // Global ❌
usePaymentMethodDetailsModal = createDisclosureStore(); // Global ❌
```

### Current Usage Examples

```typescript
// In SaleDetailsForm.tsx (Lines 35-42)
<PaymentMethodSelectorField
  name="paymentMethodId"
  label="Método de Pago"
  placeholder="Seleccionar método de pago"
  // ... other props
/>

// In CreateContractForm.tsx - Multiple instances would conflict
<PaymentMethodSelectorField name="paymentMethodId" />
<PaymentMethodSelectorField name="alternatePaymentMethodId" />
```

## Target Architecture: ClientSelectorSheet Pattern

### ClientSelector Component Analysis (ClientSelector.tsx)

The `ClientSelector` demonstrates the **ideal pattern**:

```typescript
// ✅ No global state - uses local component state
const [selectedClient, setSelectedClient] = useState<Client | null>(null);

// ✅ Opens sheet with payload, no global modals
const openClientSelector = () => {
  SheetManager.show('client-selector', {
    mode: 'select',
    currentClientId: field.value,
    onSelect: (client: Client) => {
      field.onChange(client.id);
      setSelectedClient(client);
      onClientSelect?.(client);
    },
  });
};
```

### ClientSelectorSheet Architecture (ClientSelectorSheet.tsx)

```typescript
// Multi-Screen Flow with Isolated State
const clientSelectorFlow = createMultiScreen()
  .addStep('list', ClientListScreen)         // Client list
  .addStep('create', QuickCreateClientScreen) // Quick create client
  .build();

// Sheet Registration Pattern
export interface ClientSelectorPayload {
  mode?: 'select' | 'affiliate';
  currentClientId?: string;
  onSelect: (client: Client) => void;
  onCancel?: () => void;
}

// Payload Context for Data Flow
const PayloadContext = React.createContext<ClientSelectorPayload | undefined>(undefined);

// Sheet Component with BottomSheetWrapper
function ClientSelectorSheet(props: SheetProps & ClientSelectorPayload) {
  return (
    <BottomSheetWrapper sheetId="client-selector" snapPoints={['85%']}>
      <PayloadContext.Provider value={props}>
        <Component />
      </PayloadContext.Provider>
    </BottomSheetWrapper>
  );
}
```

### Sheet Registration (sheets.tsx)

```typescript
// Line 47: Simple registration pattern
SheetManager.register('client-selector', ClientSelectorSheet);
```

## Multi-Screen Navigation Pattern

### ClientSelectorSheet Multi-Screen Implementation

```typescript
// Navigation Header with Back/Close (Lines 39-70)
const NavigationHeader = ({ title, subtitle, onClose }) => {
  const { router } = useMultiScreenContext();
  const canGoBack = router.canGoBack;

  return (
    <HStack className="items-center justify-between">
      {canGoBack && (
        <Button onPress={() => router.goBack()}>
          <Icon as={ArrowLeft} />
        </Button>
      )}
      <Text>{title}</Text>
      <Button onPress={onClose}>
        <Icon as={CloseIcon} />
      </Button>
    </HStack>
  );
};

// Client List Screen (Lines 73-127)
const ClientListScreen = () => {
  const payload = React.useContext(PayloadContext);
  const { router } = useMultiScreenContext();

  const handleCreateNew = () => {
    router.navigate('create'); // Navigate to create screen
  };

  return (
    <>
      <NavigationHeader title="Seleccionar Cliente" onClose={handleClose} />
      <ClientsListGeneric
        onClientSelect={handleSelectClient}
        onAddClient={handleCreateNew}
      />
    </>
  );
};

```

## Proposed Refactoring Approach

### 1. Create PaymentMethodSelectorSheet

**New File**: `src/features/payment-methods/components/PaymentMethodSelectorSheet.tsx`

```typescript
// Multi-screen flow: list -> details
const paymentMethodSelectorFlow = createMultiScreen()
  .addStep('list', PaymentMethodListScreen)        // Main selection screen
  .addStep('details', PaymentMethodDetailsScreen)  // View payment method details
  .build();

// Payload interface
export interface PaymentMethodSelectorPayload {
  mode?: 'select';
  currentPaymentMethodId?: string;
  enabledOnly?: boolean;
  onSelect: (paymentMethod: PaymentMethod) => void;
  onCancel?: () => void;
}

// Sheet component with isolated state
function PaymentMethodSelectorSheet(props: SheetProps & PaymentMethodSelectorPayload) {
  return (
    <BottomSheetWrapper sheetId="payment-method-selector" snapPoints={['85%']}>
      <PayloadContext.Provider value={props}>
        <Component />
      </PayloadContext.Provider>
    </BottomSheetWrapper>
  );
}
```

### 2. Refactor PaymentMethodSelectorField

**Modified File**: `src/features/payment-methods/components/PaymentMethodSelectorField.tsx`

```typescript
export function PaymentMethodSelectorField<TFieldValues extends FieldValues = FieldValues>({
  // ... existing props
}) {
  const { field, fieldState } = useController({ /* ... */ });

  // ✅ Local state instead of global
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

  // ✅ Remove global stores - no more usePaymentMethodSelectorStore()
  // ✅ Remove global modals - no more usePaymentMethodMainModal()

  const openPaymentMethodSelector = () => {
    if (!enabled) return;

    // ✅ Use SheetManager instead of global modal state
    SheetManager.show('payment-method-selector', {
      mode: 'select',
      currentPaymentMethodId: field.value,
      enabledOnly: enabledOnly,
      onSelect: (paymentMethod: PaymentMethod) => {
        field.onChange(paymentMethod.id);
        setSelectedPaymentMethod(paymentMethod);
        onPaymentMethodSelect?.(paymentMethod);
      },
    });
  };

  return (
    <FormControl isInvalid={!!fieldState.error}>
      {/* ✅ Same UI as before, but opens sheet instead of modal */}
      <Pressable onPress={openPaymentMethodSelector}>
        {/* ... existing UI */}
      </Pressable>

      {/* ✅ Remove embedded modals completely */}
    </FormControl>
  );
}
```

### 3. Multi-Screen Implementation

#### PaymentMethodListScreen
- Search functionality with local state
- Payment methods list with selection
- Navigate to details screen

#### PaymentMethodDetailsScreen
- Display payment method details
- Back navigation to list
- Select button to confirm choice


### 4. Register in sheets.tsx

```typescript
// Add to sheets.tsx
import PaymentMethodSelectorSheet from '@/features/payment-methods/components/PaymentMethodSelectorSheet';

SheetManager.register('payment-method-selector', PaymentMethodSelectorSheet);
```

### 5. State Management Migration

```typescript
// ❌ Remove: Global stores causing conflicts
// usePaymentMethodSelectorStore()
// usePaymentMethodMainModal()
// usePaymentMethodDetailsModal()

// ✅ Replace with: Local component state + Sheet payload context
// useState() for local selection state
// PayloadContext for cross-screen data flow
// SheetManager for modal management
```

## Benefits of Refactored Architecture

### 1. **Eliminates Global State Issues**
- ✅ Each PaymentMethodSelectorField instance has isolated state
- ✅ No more simultaneous modal opening across multiple instances
- ✅ Proper encapsulation and component isolation

### 2. **Consistent UX Pattern**
- ✅ Matches ClientSelectorSheet behavior and navigation
- ✅ Same multi-screen flow for details and quick create
- ✅ Consistent back/close button behavior

### 3. **Reduced Complexity**
- ✅ Eliminates need for 2 separate modals (main + details)
- ✅ Single sheet with multi-screen navigation
- ✅ Cleaner component hierarchy and state management

### 4. **Better Performance**
- ✅ No global state watchers across unrelated components
- ✅ Sheet-based rendering with better memory management
- ✅ On-demand component mounting via multi-screen router

### 5. **Improved Maintainability**
- ✅ Follows established patterns in the codebase
- ✅ Centralized sheet registration and management
- ✅ Clear separation of concerns between field and selector logic

## Implementation Strategy

### Phase 1: Create New Components
1. Create `PaymentMethodSelectorSheet.tsx` with multi-screen flow
2. Implement `PaymentMethodListScreen`, `PaymentMethodDetailsScreen`
3. Register sheet in `sheets.tsx`

### Phase 2: Refactor Field Component
1. Remove global store dependencies from `PaymentMethodSelectorField.tsx`
2. Replace modal implementation with `SheetManager.show()` calls
3. Add local state for selected payment method display

### Phase 3: Clean Up
1. Remove unused global stores (`payment-method-selector.store.ts`)
2. Remove embedded modal components from field
3. Test multiple selector instances on same screen

### Phase 4: Optional Enhancements
1. Implement advanced filtering and search features
2. Add payment method detail viewing capabilities

## Files to Modify

### New Files
- `src/features/payment-methods/components/PaymentMethodSelectorSheet.tsx`
- Individual screen components for multi-screen flow

### Modified Files
- `src/features/payment-methods/components/PaymentMethodSelectorField.tsx`
- `src/sheets.tsx` (add registration)

### Deprecated Files
- `src/features/payment-methods/stores/payment-method-selector.store.ts`
- Individual modal components (can be repurposed for screens)


## Success Criteria

1. ✅ Multiple `PaymentMethodSelectorField` instances work independently
2. ✅ No global state conflicts or simultaneous modal opening
3. ✅ Consistent UX with `ClientSelectorSheet` pattern
4. ✅ Proper navigation flow with back/close button behavior
5. ✅ Maintainable codebase following established patterns
6. ✅ Performance improvements from reduced global state watchers

This refactoring will solve the critical global state issue while aligning the payment method selection UX with the established client selection pattern, resulting in a more robust and maintainable solution.

## Additional Requirement: Payment Pending Status Handling

### Current Analysis - Sales Flow Payment Status

Based on analysis of the current sales flow implementation, there's an additional requirement for conditional UI rendering when payment status is "pending":

### Current Payment Status Implementation

#### PaymentStatus Type Structure
```typescript
// Location: src/features/sales/types/index.ts (Line 10)
export type PaymentStatus = 'paid' | 'unpaid';
```

#### PaymentStatusField Component Analysis
**File**: `src/components/forms/PaymentStatusField.tsx`

The component renders two options:
- **'paid'** - Labeled as "Pagado" with green styling and CreditCard icon
- **'unpaid'** - Labeled as "Pendiente" with orange styling and Clock icon

**Key Finding**: The payment status "unpaid" is displayed to users as "Pendiente" (Pending), indicating that "unpaid" conceptually represents pending payment status.

#### Current SaleDetailsForm Structure
**File**: `src/features/sales/components/SaleDetailsForm.tsx`

Current component order:
1. ClientSelector (Lines 13-18)
2. FormTextarea for notes (Lines 21-26)
3. PaymentStatusField (Lines 28-32)
4. **PaymentMethodSelectorField (Lines 34-42)** ← Should be hidden when pending
5. **FileSelector for attachments (Lines 44-49)** ← Should be hidden when pending

### Requirement Implementation Strategy

#### 1. Conditional Rendering Logic

When payment status is 'unpaid' (which displays as "Pendiente"), the following components should be hidden:
- PaymentMethodSelectorField
- FileSelector (attachments)

#### 2. Form Context Integration

```typescript
// In SaleDetailsForm.tsx - Add form watching
import { useWatch } from 'react-hook-form';

export const SaleDetailsForm: React.FC = () => {
  // Watch payment status to conditionally render fields
  const paymentStatus = useWatch({ name: 'paymentStatus' });
  const isPending = paymentStatus === 'unpaid';

  return (
    <VStack space="md">
      <ClientSelector />
      <FormTextarea />
      <PaymentStatusField />

      {/* Conditionally render payment method selector */}
      {!isPending && (
        <PaymentMethodSelectorField
          name="paymentMethodId"
          label="Método de Pago"
          // ... other props
        />
      )}

      {/* Conditionally render file attachments */}
      {!isPending && (
        <FileSelector
          name="fileIds"
          multi={true}
          label="Archivos adjuntos (opcional)"
        />
      )}
    </VStack>
  );
};
```

#### 3. Form Validation Considerations

When payment is pending, payment method and attachments should be optional:
- Remove validation requirements for `paymentMethodId` when status is 'unpaid'
- Remove validation requirements for `fileIds` when status is 'unpaid'

#### 4. User Experience Considerations

**Business Logic Justification**:
- When payment is pending, a payment method hasn't been selected yet
- File attachments (like payment receipts) aren't available for pending payments
- This reduces form complexity and focuses user attention on the payment status decision

#### 5. Integration with NewSaleProvider

**File**: `src/features/sales/context/NewSaleProvider.tsx`

Current default payment status is 'paid' (Line 54). Consider if this should change based on business requirements.

### Implementation Checklist for Refactored Component

When implementing the PaymentMethodSelectorSheet refactoring, ensure:

1. ✅ **Conditional Rendering**: PaymentMethodSelectorField respects payment status
2. ✅ **Form Integration**: Component properly integrates with useWatch for reactive updates
3. ✅ **Validation Updates**: Form validation schema accounts for conditional requirements
4. ✅ **UX Consistency**: Hidden fields don't leave awkward spacing in the form layout
5. ✅ **State Management**: Payment status changes properly trigger UI updates
6. ✅ **Testing**: Cover both pending and paid states in component tests

### Modified SaleDetailsForm.tsx Requirements

```typescript
// Enhanced implementation with conditional rendering
export const SaleDetailsForm: React.FC = () => {
  const paymentStatus = useWatch({ name: 'paymentStatus' });
  const isPaymentPending = paymentStatus === 'unpaid';

  return (
    <VStack space="md">
      <ClientSelector />
      <FormTextarea />
      <PaymentStatusField />

      {/* Payment method selector - hidden when payment is pending */}
      {!isPaymentPending && (
        <PaymentMethodSelectorField
          name="paymentMethodId"
          label="Método de Pago"
          placeholder="Seleccionar método de pago"
          description="Seleccione el método de pago utilizado para esta venta"
          allowClear={true}
          enabledOnly={true}
        />
      )}

      {/* File attachments - hidden when payment is pending */}
      {!isPaymentPending && (
        <FileSelector
          name="fileIds"
          multi={true}
          label="Archivos adjuntos (opcional)"
        />
      )}
    </VStack>
  );
};
```

This additional requirement ensures that the refactored PaymentMethodSelectorField properly integrates with the sales flow's payment status logic, providing a cleaner user experience when payments are in pending status.