# Integration Example - React Native Bottom Sheet v5

This document shows how to integrate the new bottom sheet system into your mobile app.

## 1. Basic Setup

### Update AppProviders.tsx

```typescript
// packages/mobile/src/providers/AppProviders.tsx
import { SheetProvider } from '@gymspace/sheet';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <SheetProvider> {/* New SheetProvider wraps children */}
            {children}
          </SheetProvider>
        </QueryClientProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
```

## 2. Register Sheets

### Update sheets.tsx

```typescript
// packages/mobile/src/sheets.tsx
import { SheetManager } from '@gymspace/sheet';
import { ClientSelectorSheet } from '@/features/clients/components/ClientSelectorSheet';
import { ContractRenewalDrawer } from '@/features/contracts/components/ContractRenewalDrawer';
// ... import other sheets

// Register sheets on app initialization
export function registerSheets() {
  SheetManager.register('client-selector', ClientSelectorSheet, {
    snapPoints: ['50%', '90%'],
    enablePanDownToClose: true,
  });

  SheetManager.register('contract-renewal', ContractRenewalDrawer, {
    snapPoints: ['60%', '95%'],
    enablePanDownToClose: true,
  });

  // Register other sheets...
}

// Call this in your app entry point
registerSheets();
```

## 3. Sheet Component Examples

### Simple Content Sheet

```typescript
// src/features/assets/components/AssetPreviewSheet.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { BottomSheetWrapper, BottomSheetView } from '@gymspace/sheet';
import type { SheetProps } from '@gymspace/sheet';

interface AssetPreviewSheetProps {
  asset: Asset;
}

export function AssetPreviewSheet({ asset }: SheetProps<AssetPreviewSheetProps>) {
  return (
    <BottomSheetWrapper
      snapPoints={['50%']}
      enablePanDownToClose
      sheetId="asset-preview"
    >
      <BottomSheetView>
        <View className="p-4">
          <Text className="text-xl font-bold">{asset.name}</Text>
          <Text className="text-gray-600">{asset.description}</Text>
        </View>
      </BottomSheetView>
    </BottomSheetWrapper>
  );
}
```

### Scrollable Form Sheet

```typescript
// src/features/contracts/components/ContractRenewalDrawer.tsx
import React from 'react';
import { View, Text, Button } from 'react-native';
import { BottomSheetWrapper, BottomSheetScrollView } from '@gymspace/sheet';
import { FormProvider, useForm } from 'react-hook-form';
import { FormInput, FormSelect } from '@/components/forms';

export function ContractRenewalDrawer({ contractId }: SheetProps<{ contractId: string }>) {
  const form = useForm();

  const onSubmit = (data: any) => {
    // Handle form submission
    SheetManager.hide('contract-renewal');
  };

  return (
    <BottomSheetWrapper
      snapPoints={['60%', '95%']}
      enablePanDownToClose
      sheetId="contract-renewal"
      scrollable // Enables automatic ScrollView wrapper
    >
      <BottomSheetScrollView>
        <FormProvider {...form}>
          <View className="p-4">
            <Text className="text-xl font-bold mb-4">Renew Contract</Text>

            <FormInput
              name="duration"
              label="Duration (months)"
              placeholder="Enter duration"
              keyboardType="numeric"
            />

            <FormSelect
              name="planId"
              label="Select Plan"
              options={plans}
            />

            <FormInput
              name="startDate"
              label="Start Date"
              placeholder="Select date"
            />

            <Button title="Renew Contract" onPress={form.handleSubmit(onSubmit)} />
          </View>
        </FormProvider>
      </BottomSheetScrollView>
    </BottomSheetWrapper>
  );
}
```

### List Sheet

```typescript
// src/features/clients/components/ClientSelectorSheet.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BottomSheetWrapper, BottomSheetFlatList } from '@gymspace/sheet';
import { useClients } from '@/features/clients/hooks';

export function ClientSelectorSheet({ onSelect }: SheetProps<{ onSelect: (client: Client) => void }>) {
  const { data: clients } = useClients();

  const renderItem = ({ item }: { item: Client }) => (
    <TouchableOpacity
      className="p-4 border-b border-gray-200"
      onPress={() => {
        onSelect(item);
        SheetManager.hide('client-selector');
      }}
    >
      <Text className="font-medium">{item.name}</Text>
      <Text className="text-sm text-gray-600">{item.email}</Text>
    </TouchableOpacity>
  );

  return (
    <BottomSheetWrapper
      snapPoints={['50%', '90%']}
      enablePanDownToClose
      sheetId="client-selector"
    >
      <BottomSheetFlatList
        data={clients}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </BottomSheetWrapper>
  );
}
```

## 4. Using Sheets in Components

### With SheetManager (Programmatic)

```typescript
import { SheetManager } from '@gymspace/sheet';

function MyComponent() {
  const handleOpenSheet = () => {
    SheetManager.show('client-selector', {
      onSelect: (client) => {
        console.log('Selected client:', client);
      }
    });
  };

  return (
    <Button title="Select Client" onPress={handleOpenSheet} />
  );
}
```

### With useSheet Hook

```typescript
import { useSheet } from '@gymspace/sheet';

function MyComponent() {
  const clientSheet = useSheet('client-selector');

  const handleOpenSheet = () => {
    clientSheet.show({
      onSelect: (client) => {
        console.log('Selected client:', client);
      }
    });
  };

  return (
    <Button title="Select Client" onPress={handleOpenSheet} />
  );
}
```

### With useSheetManager Hook

```typescript
import { useSheetManager } from '@gymspace/sheet';

function MyComponent() {
  const sheetManager = useSheetManager();

  const handleOpenMultipleSheets = () => {
    // Open first sheet
    sheetManager.show('client-selector', {
      onSelect: (client) => {
        // After selecting client, open contract sheet
        sheetManager.show('contract-renewal', {
          clientId: client.id
        });
      }
    });
  };

  return (
    <Button title="Start Flow" onPress={handleOpenMultipleSheets} />
  );
}
```

## 5. Dynamic Snap Points

```typescript
import { useBottomSheetDynamicSnapPoints } from '@gymspace/sheet';

function DynamicSheet() {
  const {
    animatedHandleHeight,
    animatedSnapPoints,
    animatedContentHeight,
    handleContentLayout,
  } = useBottomSheetDynamicSnapPoints(['25%', 'CONTENT_HEIGHT']);

  return (
    <BottomSheetWrapper
      snapPoints={animatedSnapPoints}
      handleHeight={animatedHandleHeight}
      contentHeight={animatedContentHeight}
    >
      <BottomSheetView onLayout={handleContentLayout}>
        {/* Content that changes height */}
      </BottomSheetView>
    </BottomSheetWrapper>
  );
}
```

## 6. Custom Backdrop

```typescript
function CustomBackdropSheet() {
  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.7}
        pressBehavior="close"
      />
    ),
    []
  );

  return (
    <BottomSheetWrapper
      snapPoints={['50%']}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetView>
        {/* Content */}
      </BottomSheetView>
    </BottomSheetWrapper>
  );
}
```

## 7. Migration Checklist

- [ ] Update AppProviders with SheetProvider
- [ ] Register all sheets in sheets.tsx
- [ ] Convert each sheet component to use BottomSheetWrapper
- [ ] Replace ScrollView with BottomSheetScrollView in scrollable sheets
- [ ] Replace FlatList with BottomSheetFlatList in list sheets
- [ ] Update all SheetManager.show() calls with proper props
- [ ] Test on both iOS and Android
- [ ] Verify gesture handling works correctly
- [ ] Check keyboard avoidance in form sheets