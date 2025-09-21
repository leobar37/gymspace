# Task: Refactor Inventory New Sale Flow - Bottom Sheet to Expo Router

**Created**: 2025-09-20
**Status**: Planning
**Priority**: Medium
**Estimated Effort**: 6-8 hours

## Executive Summary

Refactor the inventory new-sale flow from using a bottom sheet modal to leveraging Expo Router's file-based routing features. This involves converting `new-sale.tsx` into a folder structure with dedicated routes for the main sale screen and item selection, with a layout file managing the shared provider context.

## Current State Analysis

### File Structure (Current)
```
/packages/mobile/src/app/inventory/
├── _layout.tsx
├── new-sale.tsx (monolithic screen with embedded modal)
└── ...other routes
```

### Implementation Details

#### Current Architecture
- **Single File**: `new-sale.tsx` contains all logic (600+ lines)
- **Modal Pattern**: Uses `@gorhom/bottom-sheet` for item selection
- **State Management**:
  - `NewSaleProvider` context for form and data
  - `useCartStore` (Zustand) for cart state
  - `useSaleUIStore` (Zustand) for UI state
- **Provider Stack**:
  ```
  NewSaleProvider
    └── GestureHandlerRootView
        └── BottomSheetModalProvider
            └── NewSaleContent
  ```

#### Key Components
1. **NewSaleScreen**: Main wrapper with providers
2. **NewSaleContent**: Core UI logic and layout
3. **ItemSelectionModal**: Full-screen bottom sheet for product/service selection
4. **ScreenForm**: Main form area with cart display
5. **SaleDetailsForm**: Customer and payment details

## Target State

### Proposed File Structure
```
/packages/mobile/src/app/inventory/
├── _layout.tsx
├── new-sale/
│   ├── _layout.tsx (NewSaleProvider, shared context)
│   ├── index.tsx (main sale screen - cart & form)
│   └── select-items.tsx (item selection screen)
└── ...other routes
```

### Architecture Changes
- **Folder-Based Routes**: Convert single file to folder with sub-routes
- **Layout Provider**: Move `NewSaleProvider` to layout for state persistence
- **Screen Separation**: Split modal content into dedicated route
- **Navigation Pattern**: Use Expo Router navigation instead of modal state

## Implementation Plan

### Phase 1: Structure Setup (2-3 hours)

#### 1.1 Create Folder Structure
```bash
inventory/
├── new-sale/
│   ├── _layout.tsx
│   ├── index.tsx
│   └── select-items.tsx
```

#### 1.2 Layout Configuration (`new-sale/_layout.tsx`)
```typescript
export default function NewSaleLayout() {
  return (
    <NewSaleProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: 'Nueva Venta',
            headerShown: false
          }}
        />
        <Stack.Screen
          name="select-items"
          options={{
            title: 'Seleccionar Productos',
            presentation: 'modal',
            animation: 'slide_from_bottom'
          }}
        />
      </Stack>
    </NewSaleProvider>
  );
}
```

### Phase 2: Component Migration (3-4 hours)

#### 2.1 Main Sale Screen (`new-sale/index.tsx`)
**Extract from current `new-sale.tsx`:**
- `ScreenForm` component
- `SaleDetailsForm` component
- Cart display logic
- Form submission handlers

**Key Changes:**
- Remove `BottomSheetModalProvider`
- Replace modal trigger with navigation:
  ```typescript
  // Before
  onPress={() => openModal()}

  // After
  onPress={() => router.push('/inventory/new-sale/select-items')}
  ```

#### 2.2 Item Selection Screen (`new-sale/select-items.tsx`)
**Extract from `ItemSelectionModal`:**
- Product/Service tabs
- Search functionality
- Item lists with quantity controls
- Selection confirmation logic

**Key Changes:**
- Convert from `BottomSheetModal` to regular `Screen`
- Replace modal close with navigation:
  ```typescript
  // Before
  bottomSheetRef.current?.close()

  // After
  router.back()
  ```
- Maintain footer with quantity selector

### Phase 3: State Management Refactoring (2-3 hours)

#### 3.1 Provider Adjustments
**`NewSaleProvider` modifications:**
- Ensure provider wraps all sub-routes via layout
- Remove bottom sheet ref management
- Adjust data loading to work across routes

#### 3.2 Store Updates
**`useSaleUIStore` changes:**
- Remove modal state management
- Convert to route-based state if needed
- Keep search and tab state

**`useCartStore`:**
- No changes needed (global state works across routes)

#### 3.3 Hook Updates
**`useNewSale` hook:**
- Remove modal control methods
- Add navigation helpers if needed
- Ensure state persistence across route changes

### Phase 4: Navigation & UX (1-2 hours)

#### 4.1 Navigation Flow
```typescript
// Navigation sequence
1. /inventory → /inventory/new-sale (index)
2. Tap "Add Items" → /inventory/new-sale/select-items
3. Select items → router.back() to index
4. Complete sale → router.replace('/inventory')
```

#### 4.2 Transition Animations
- Configure Stack.Screen options for smooth transitions
- Consider using `presentation: 'modal'` for item selection
- Maintain gesture support where applicable

#### 4.3 Back Button Handling
- Implement proper back navigation in headers
- Handle unsaved changes warnings
- Clear cart on unmount if needed

## Technical Considerations

### Benefits of Refactoring
1. **URL-based State**: Better deep linking support
2. **Separation of Concerns**: Cleaner code organization
3. **Native Navigation**: Leverages platform navigation patterns
4. **Maintainability**: Easier to understand and modify
5. **Testing**: Simpler to test individual routes

### Potential Challenges

#### 1. State Persistence
**Issue**: Form and cart state must persist across routes
**Solution**: Use layout-level provider and global stores

#### 2. Animation Differences
**Issue**: Bottom sheet animations differ from route transitions
**Solution**: Configure Stack.Screen with `presentation: 'modal'` and custom animations

#### 3. Gesture Handling
**Issue**: Loss of swipe-to-close functionality
**Solution**: Use native navigation gestures or add custom gesture handler

#### 4. Provider Nesting
**Issue**: Multiple provider instances
**Solution**: Carefully manage provider hierarchy in layout

### Migration Checklist

#### Pre-Migration
- [ ] Review current implementation thoroughly
- [ ] Document all state dependencies
- [ ] Identify all navigation touchpoints
- [ ] Create backup of current implementation

#### During Migration
- [ ] Create folder structure
- [ ] Implement layout with provider
- [ ] Extract and migrate main screen
- [ ] Extract and migrate item selection
- [ ] Update navigation calls
- [ ] Test state persistence
- [ ] Verify form functionality
- [ ] Check API integrations

#### Post-Migration
- [ ] Remove old `new-sale.tsx` file
- [ ] Update imports in other files
- [ ] Test complete flow end-to-end
- [ ] Check for memory leaks
- [ ] Document new navigation pattern
- [ ] Update any related documentation

## Code References

### Current Implementation
- **Main File**: `packages/mobile/src/app/inventory/new-sale.tsx`
- **Providers**: Lines 50-100 (NewSaleProvider)
- **Modal Component**: Lines 400-550 (ItemSelectionModal)
- **Stores**:
  - `packages/mobile/src/features/sales/stores/cart-store.ts`
  - `packages/mobile/src/features/sales/stores/sale-ui-store.ts`

### Related Patterns
- **Client Routes**: `packages/mobile/src/app/clients/` (folder structure example)
- **Layout Example**: `packages/mobile/src/app/(app)/_layout.tsx` (provider integration)
- **Modal Pattern**: Check other bottom sheet implementations for consistency

## Alternative Approaches

### Option A: Minimal Change (Recommended for Phase 1)
- Keep bottom sheet but move provider to layout
- Minimal code changes, improved structure
- Lower risk, faster implementation

### Option B: Full Route Conversion (Recommended for Phase 2)
- Complete conversion to routes as described above
- Better long-term maintainability
- Aligns with Expo Router best practices

### Option C: Hybrid Approach
- Keep bottom sheet for item selection
- Use routes for other flows (summary, payment)
- Balance between current UX and improved structure

## Success Criteria

1. **Functionality**: All existing features work correctly
2. **Performance**: No degradation in load times or animations
3. **Code Quality**: Improved separation of concerns
4. **User Experience**: Seamless navigation flow
5. **Maintainability**: Easier to add new features

## Resources & References

- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [React Navigation Modal Presentation](https://reactnavigation.org/docs/modal/)
- Current implementation: `packages/mobile/src/app/inventory/new-sale.tsx`
- Example folder structure: `packages/mobile/src/app/clients/`

## Notes for Developer

- Start with Phase 1 to minimize risk
- Test thoroughly on both iOS and Android
- Consider keeping the original file as backup during development
- Use git branches for safe experimentation
- Coordinate with team if this affects other ongoing work
- Remember to update any documentation or comments that reference the old structure

---

**End of Task Document**