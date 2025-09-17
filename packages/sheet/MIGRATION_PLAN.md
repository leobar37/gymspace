# Migration Plan: React Native Bottom Sheet v5 Integration

## Overview
This document outlines the migration from the current custom sheet implementation to @gorhom/bottom-sheet v5 while preserving the SheetManager pattern for programmatic sheet control.

## Current Implementation Analysis

### What Will Be Preserved
1. **SheetManager Pattern** (`packages/mobile/src/sheets.tsx`)
   - Programmatic sheet control via `SheetManager.show()`
   - Global sheet registry and management
   - Type-safe sheet definitions
   - Dynamic content injection

2. **Sheet Registration System**
   - Central registry of available sheets
   - Type definitions for sheet props
   - Lazy loading of sheet components

### What Will Be Removed
1. **Custom Sheet Components** (ALL will be removed)
   - `/packages/sheet/src/components/Sheet.tsx`
   - `/packages/sheet/src/components/SheetBackdrop.tsx`
   - `/packages/sheet/src/components/SheetContent.tsx`
   - `/packages/sheet/src/components/SheetDragIndicator.tsx`
   - `/packages/sheet/src/components/SheetFooter.tsx`
   - `/packages/sheet/src/components/SheetHeader.tsx`
   - `/packages/sheet/src/components/SheetTrigger.tsx`

2. **Custom Animations and Gestures** (Replaced by library's optimized implementation)
   - PanGestureHandler implementation
   - Custom spring animations
   - Manual drag handling logic

3. **Custom ScrollView Integrations** (Replaced by BottomSheet components)
   - `/packages/sheet/src/views/FlashList.tsx`
   - `/packages/sheet/src/views/FlatList.tsx`
   - `/packages/sheet/src/views/ScrollView.tsx`

4. **Features Not Available in v5** (Will be removed if not critical)
   - Custom trigger components (use programmatic control instead)
   - Non-standard animations (use library's built-in animations)

## New Implementation Architecture with @gorhom/bottom-sheet v5

### Core Components Structure
```
packages/sheet/src/
├── index.tsx                    # Main exports
├── SheetProvider.tsx            # Wraps BottomSheetModalProvider
├── SheetManager.tsx             # Programmatic control (preserved pattern)
├── BottomSheetWrapper.tsx       # Wrapper around BottomSheetModal
├── types.ts                     # Type definitions
└── hooks/
    ├── useSheet.ts              # Hook for sheet control
    └── useSheetManager.ts       # Hook for manager access
```

### 1. SheetProvider Component
**Purpose**: Wrap the app with bottom sheet v5 providers

**Implementation**:
```typescript
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

export function SheetProvider({ children }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        {children}
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
```

**Features**:
- Initialize BottomSheetModalProvider from v5
- Wrap with GestureHandlerRootView for gesture support
- Manage sheet references globally
- Handle modal presentation queue

### 2. SheetManager (Enhanced for v5)
**Purpose**: Programmatic control maintaining current API with v5 integration

**Features Preserved**:
- `SheetManager.show(sheetId, props)`
- `SheetManager.hide(sheetId)`
- `SheetManager.hideAll()`
- Type-safe sheet definitions

**v5 Integration**:
```typescript
class SheetManager {
  private modalRefs = new Map<string, RefObject<BottomSheetModal>>();

  show(sheetId: string, props?: any) {
    const ref = this.modalRefs.get(sheetId);
    ref?.current?.present(props);
  }

  hide(sheetId: string) {
    const ref = this.modalRefs.get(sheetId);
    ref?.current?.dismiss();
  }

  hideAll() {
    // Uses v5's dismissAll from useBottomSheetModal hook
  }
}
```

### 3. BottomSheetWrapper Component
**Purpose**: Unified wrapper around BottomSheetModal for consistent API

**Props Interface**:
```typescript
interface BottomSheetWrapperProps {
  children: React.ReactNode;
  snapPoints?: (string | number)[];  // ["25%", "50%", "90%"] or [300, 500]
  enablePanDownToClose?: boolean;
  enableDynamicSizing?: boolean;      // For dynamic content height
  index?: number;                      // Initial snap point
  onChange?: (index: number) => void;
  onDismiss?: () => void;
  // Scrollable content support
  scrollable?: boolean;                // Auto-wraps in BottomSheetScrollView
}
```

## Scrollable Sheet Implementation

### ContractRenewalDrawer Example
The `ContractRenewalDrawer.tsx` needs scrollable content. Here's how to implement with v5:

```typescript
// packages/mobile/src/features/contracts/components/ContractRenewalDrawer.tsx
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';

export function ContractRenewalDrawer() {
  return (
    <BottomSheetWrapper snapPoints={['50%', '90%']} scrollable>
      <BottomSheetScrollView>
        {/* Form content */}
        <FormProvider {...form}>
          <FormInput name="duration" />
          <FormSelect name="plan" />
          {/* More form fields */}
        </FormProvider>
      </BottomSheetScrollView>
    </BottomSheetWrapper>
  );
}
```

**Key Points for Scrollable Sheets**:
- Use `BottomSheetScrollView` instead of regular ScrollView
- Library handles gesture conflicts automatically
- Supports keyboard avoidance out of the box
- Better performance than custom implementation

## Complete List of Affected Files

### 1. Package Dependencies
**Remove**:
- Custom reanimated animations
- Custom gesture handlers
- @gorhom/portal (if only used for sheets)

**Add**:
- @gorhom/bottom-sheet (^5.x)
- Keep react-native-reanimated (required by v5)
- Keep react-native-gesture-handler (required by v5)

### 2. Core Files to Modify

#### Provider Setup
- **`packages/mobile/src/providers/AppProviders.tsx`**
  - Update SheetProvider import and usage
  - Ensure proper provider hierarchy

#### Sheet Registry
- **`packages/mobile/src/sheets.tsx`**
  - Update sheet definitions for v5 API
  - Modify registration to use BottomSheetModal refs

### 3. Complete List of Affected Sheet Components

#### Asset Management
1. **`src/features/assets/components/AssetPreviewSheet.tsx`**
   - Convert to BottomSheetModal
   - Update content wrapper

2. **`src/features/assets/components/AssetSelectorSheet.tsx`**
   - Convert to BottomSheetModal with list
   - Use BottomSheetFlatList for performance

#### Client Management
3. **`src/features/clients/components/ClientSelector.tsx`**
   - Contains sheet logic, needs update

4. **`src/features/clients/components/ClientSelectorSheet.tsx`**
   - Convert to BottomSheetModal
   - Use BottomSheetFlatList for client list

#### Contract Management
5. **`src/features/contracts/components/ContractFreezeSheet.tsx`**
   - Convert to BottomSheetModal
   - Simple form, use BottomSheetView

6. **`src/features/contracts/components/ContractRenewalDrawer.tsx`**
   - **Scrollable content required**
   - Use BottomSheetScrollView for form
   - Multiple snap points for expansion

7. **`src/features/contracts/components/ContractsFiltersSheet.tsx`**
   - Convert to BottomSheetModal
   - Filter form with BottomSheetScrollView

#### Inventory Management
8. **`src/features/inventory/components/ProductFiltersSheet.tsx`**
   - Convert to BottomSheetModal
   - Filter options with BottomSheetView

9. **`src/features/inventory/components/SalesFiltersSheet.tsx`**
   - Convert to BottomSheetModal
   - Similar to ProductFiltersSheet

10. **`src/features/inventory/components/StockAdjustment.tsx`**
    - Contains sheet logic, needs update

11. **`src/features/inventory/components/StockAdjustmentModal.tsx`**
    - Convert to BottomSheetModal
    - Form with BottomSheetView

12. **`src/features/inventory/components/StockMovementDetailSheet.tsx`**
    - Convert to BottomSheetModal
    - Detail view with BottomSheetScrollView

13. **`src/features/inventory/components/StockMovementsSection.tsx`**
    - May contain sheet triggers

14. **`src/features/inventory/components/StockMovementsSheet.tsx`**
    - Convert to BottomSheetModal
    - List view with BottomSheetFlatList

#### Dashboard
15. **`src/features/dashboard/components/CheckInButton.tsx`**
    - May trigger sheets programmatically

#### Other Components
16. **`src/components/TimeRange.tsx`**
    - May contain sheet-related logic

17. **`src/shared/loading-screen/LoadingScreen.tsx`**
    - Check for sheet interactions

### 4. Migration Patterns by Component Type

#### Simple Content Sheet
```typescript
// For: AssetPreviewSheet, StockMovementDetailSheet
<BottomSheetWrapper snapPoints={['50%']}>
  <BottomSheetView>
    {/* Static content */}
  </BottomSheetView>
</BottomSheetWrapper>
```

#### Scrollable Form Sheet
```typescript
// For: ContractRenewalDrawer, ContractsFiltersSheet
<BottomSheetWrapper snapPoints={['50%', '90%']}>
  <BottomSheetScrollView>
    <FormProvider {...form}>
      {/* Form fields */}
    </FormProvider>
  </BottomSheetScrollView>
</BottomSheetWrapper>
```

#### List Sheet
```typescript
// For: ClientSelectorSheet, StockMovementsSheet
<BottomSheetWrapper snapPoints={['50%', '90%']}>
  <BottomSheetFlatList
    data={items}
    renderItem={renderItem}
    keyExtractor={keyExtractor}
  />
</BottomSheetWrapper>
```

## Implementation Examples for v5

### Basic Sheet with SheetManager
```typescript
// Registration in sheets.tsx
SheetManager.register('example-sheet', ExampleSheet);

// Usage
SheetManager.show('example-sheet', { data: someData });

// Component
function ExampleSheet({ data }) {
  return (
    <BottomSheetWrapper snapPoints={['50%']}>
      <BottomSheetView>
        <Text>{data.title}</Text>
      </BottomSheetView>
    </BottomSheetWrapper>
  );
}

## Implementation Phases

### Phase 1: Core Setup
1. Install @gorhom/bottom-sheet and dependencies
2. Create new SheetProvider with BottomSheetModalProvider
3. Implement BottomSheetWrapper component
4. Update SheetManager to work with new refs

### Phase 2: Migration
1. Update each sheet component to use new wrapper
2. Replace custom scroll components with BottomSheet variants
3. Update snap points and gestures configuration
4. Test each sheet individually

### Phase 3: Cleanup
1. Remove old custom implementation files
2. Remove unused dependencies
3. Update documentation
4. Performance optimization

## Benefits of Migration to v5

1. **Reduced Maintenance**: Leverage well-maintained library with active development
2. **Better Performance**: Native optimizations and gesture handling improvements in v5
3. **Built-in Features**:
   - Keyboard handling with automatic avoidance
   - Dynamic content sizing
   - Multiple snap points with smooth transitions
   - Scrollable content support (BottomSheetScrollView, BottomSheetFlatList)
4. **Community Support**: Large community, regular updates, extensive documentation
5. **Accessibility**: Improved screen reader support and keyboard navigation
6. **v5 Specific Benefits**:
   - Better modal management with BottomSheetModalProvider
   - Enhanced performance with optimized re-renders
   - Improved gesture system integration

## Risks and Mitigation

1. **Breaking Changes**
   - Risk: Different API might break existing functionality
   - Mitigation: Wrapper component to maintain consistent API

2. **Visual Differences**
   - Risk: Sheets might look/behave differently
   - Mitigation: Customize styling and animations to match current UX

3. **Performance Regression**
   - Risk: New implementation might be slower
   - Mitigation: Profile and optimize, use built-in performance features

## Configuration Examples

### Basic Sheet
```typescript
SheetManager.show('basic-sheet', {
  snapPoints: ['50%'],
  children: <ContentComponent />
});
```

### Dynamic Height Sheet
```typescript
SheetManager.show('dynamic-sheet', {
  enableDynamicSizing: true,
  children: <DynamicContent />
});
```

### Full Screen Sheet
```typescript
SheetManager.show('fullscreen-sheet', {
  snapPoints: ['95%'],
  enablePanDownToClose: true,
  children: <FullScreenContent />
});
```

## Testing Strategy

1. **Unit Tests**: Test SheetManager API consistency
2. **Integration Tests**: Test sheet lifecycle and callbacks
3. **Visual Regression**: Compare sheet appearance before/after
4. **Performance Tests**: Measure open/close animation performance
5. **Device Testing**: Test on various devices and OS versions

## Timeline Estimate

- **Phase 1**: 1 day (Core setup and wrapper implementation)
- **Phase 2**: 3-4 days (Migration of 17 affected components)
- **Phase 3**: 1 day (Cleanup and optimization)
- **Testing**: 1 day (Comprehensive testing)

**Total**: 6-7 days

## Success Criteria

1. All existing sheets work with new implementation
2. SheetManager API remains unchanged
3. Performance is equal or better
4. No visual regression in sheet behavior
5. Reduced codebase size
6. Improved maintainability

## Next Steps

1. Review and approve migration plan
2. Create feature branch for migration
3. Install dependencies and setup base implementation
4. Migrate sheets incrementally
5. Test thoroughly
6. Deploy to staging for QA
7. Merge to main branch