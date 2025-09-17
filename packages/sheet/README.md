# @gymspace/sheet

A React Native bottom sheet library built on top of [@gorhom/bottom-sheet](https://github.com/gorhom/react-native-bottom-sheet) v5, providing a simplified and consistent API for managing sheets across your React Native application.

## Features

- 🚀 **Built on @gorhom/bottom-sheet v5** - Leverages the most popular and well-maintained bottom sheet library
- 🎯 **Programmatic Control** - Manage sheets through `SheetManager` for imperative API
- 🪝 **React Hooks** - Use `useSheet` and `useSheetManager` for declarative sheet management
- 📱 **Cross-Platform** - Works seamlessly on iOS and Android
- ⚡ **High Performance** - Optimized animations and gesture handling
- 🎨 **Customizable** - Full control over styling, snap points, and behaviors
- 🔄 **Scrollable Content** - Built-in support for scrollable sheets with proper gesture handling
- 📋 **List Support** - Optimized components for FlatList and SectionList
- ♿ **Accessible** - Built-in accessibility support

## Installation

```bash
# Using npm
npm install @gymspace/sheet

# Using yarn
yarn add @gymspace/sheet

# Using pnpm
pnpm add @gymspace/sheet
```

### Peer Dependencies

Make sure you have the following peer dependencies installed:

```bash
npm install react-native-reanimated react-native-gesture-handler react-native-safe-area-context @gorhom/bottom-sheet
```

## Quick Start

### 1. Setup Provider

Wrap your app with `SheetProvider`:

```typescript
// App.tsx or AppProviders.tsx
import React from 'react';
import { SheetProvider } from '@gymspace/sheet';

export function App() {
  return (
    <SheetProvider>
      {/* Your app content */}
    </SheetProvider>
  );
}
```

### 2. Create a Sheet Component

```typescript
// components/MySheet.tsx
import React from 'react';
import { View, Text, Button } from 'react-native';
import { BottomSheetWrapper, SheetManager, SheetProps } from '@gymspace/sheet';

interface MySheetProps extends SheetProps {
  title?: string;
  onConfirm?: () => void;
}

export function MySheet({ title = 'Default Title', onConfirm }: MySheetProps) {
  const handleConfirm = () => {
    onConfirm?.();
    SheetManager.hide('my-sheet');
  };

  return (
    <BottomSheetWrapper
      sheetId="my-sheet"
      snapPoints={['50%', '90%']}
      enablePanDownToClose
    >
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
          {title}
        </Text>
        <Button title="Confirm" onPress={handleConfirm} />
        <Button
          title="Cancel"
          onPress={() => SheetManager.hide('my-sheet')}
          color="red"
        />
      </View>
    </BottomSheetWrapper>
  );
}
```

### 3. Register and Use Sheets

```typescript
// sheets.tsx - Register your sheets
import { SheetManager } from '@gymspace/sheet';
import { MySheet } from './components/MySheet';

export function registerSheets() {
  SheetManager.register('my-sheet', MySheet);
}

// Call this in your app initialization
registerSheets();
```

```typescript
// Usage in any component
import { SheetManager } from '@gymspace/sheet';

function SomeComponent() {
  const handleOpenSheet = () => {
    SheetManager.show('my-sheet', {
      title: 'Custom Title',
      onConfirm: () => console.log('Confirmed!'),
    });
  };

  return (
    <Button title="Open Sheet" onPress={handleOpenSheet} />
  );
}
```

## API Reference

### Components

#### `SheetProvider`

The root provider that must wrap your app to enable sheet functionality.

```typescript
interface SheetProviderProps {
  children: ReactNode;
}
```

#### `BottomSheetWrapper`

The main component for creating bottom sheets.

```typescript
interface BottomSheetWrapperProps extends Omit<BottomSheetModalProps, 'children'> {
  children?: any;
  scrollable?: boolean;  // Automatically wraps children in BottomSheetScrollView
  sheetId?: string;      // Unique identifier for the sheet
  onShow?: () => void;   // Callback when sheet is shown
  onHide?: () => void;   // Callback when sheet is hidden
}
```

**Props:**
- `snapPoints`: Array of strings or numbers defining snap positions (e.g., `['25%', '50%', '90%']`)
- `enablePanDownToClose`: Boolean to enable closing by swiping down
- `enableDynamicSizing`: Boolean for dynamic content height
- `scrollable`: Boolean to automatically wrap children in scrollable container
- `sheetId`: Unique identifier for programmatic control
- `onShow`: Callback when sheet appears
- `onHide`: Callback when sheet is dismissed

### SheetManager

Static class for programmatic sheet control.

```typescript
class SheetManager {
  // Register a sheet component
  static register(id: string, component: React.ComponentType<any>, options?: Partial<BottomSheetModalProps>): void;

  // Show a registered sheet
  static show(id: string, props?: any): void;

  // Hide a specific sheet
  static hide(id: string): void;

  // Hide all sheets
  static hideAll(): void;

  // Check if a sheet is registered
  static isRegistered(id: string): boolean;

  // Unregister a sheet
  static unregister(id: string): void;
}
```

### Hooks

#### `useSheet(sheetId: string)`

Hook for controlling a specific sheet.

```typescript
const sheet = useSheet('my-sheet');

// Methods
sheet.show(props);    // Show the sheet with props
sheet.hide();         // Hide the sheet
sheet.isRegistered(); // Check if sheet is registered
```

#### `useSheetManager()`

Hook for accessing the global sheet manager.

```typescript
const manager = useSheetManager();

// Methods
manager.show(id, props);
manager.hide(id);
manager.hideAll();
manager.register(id, component, options);
manager.unregister(id);
manager.isRegistered(id);
```

### Types

```typescript
// Base props interface for all sheet components
interface SheetProps {
  sheetRef?: RefObject<BottomSheetModal>;
  onDismiss?: () => void;
}

// Extend this for your sheet component props
interface MySheetProps extends SheetProps {
  title: string;
  data: any[];
}
```

## Usage Patterns

### Simple Content Sheet

For static content that doesn't need scrolling:

```typescript
function SimpleSheet() {
  return (
    <BottomSheetWrapper
      sheetId="simple"
      snapPoints={['40%']}
    >
      <View style={{ padding: 16 }}>
        <Text>Simple content here</Text>
      </View>
    </BottomSheetWrapper>
  );
}
```

### Scrollable Form Sheet

For forms or content that might overflow:

```typescript
import { BottomSheetScrollView } from '@gymspace/sheet';

function FormSheet() {
  return (
    <BottomSheetWrapper
      sheetId="form"
      snapPoints={['50%', '90%']}
      scrollable  // Enables automatic scrolling
    >
      <View style={{ padding: 16 }}>
        <TextInput placeholder="Field 1" />
        <TextInput placeholder="Field 2" />
        <TextInput placeholder="Field 3" />
        {/* More form fields... */}
      </View>
    </BottomSheetWrapper>
  );
}
```

### List Sheet

For displaying lists of items:

```typescript
import { BottomSheetFlatList } from '@gymspace/sheet';

function ListSheet({ items }: { items: any[] }) {
  const renderItem = ({ item }) => (
    <View style={{ padding: 16 }}>
      <Text>{item.name}</Text>
    </View>
  );

  return (
    <BottomSheetWrapper
      sheetId="list"
      snapPoints={['50%', '90%']}
    >
      <BottomSheetFlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </BottomSheetWrapper>
  );
}
```

### Dynamic Height Sheet

For content with varying height:

```typescript
import { useBottomSheetDynamicSnapPoints } from '@gymspace/sheet';

function DynamicSheet() {
  const {
    animatedHandleHeight,
    animatedSnapPoints,
    animatedContentHeight,
    handleContentLayout,
  } = useBottomSheetDynamicSnapPoints(['CONTENT_HEIGHT']);

  return (
    <BottomSheetWrapper
      snapPoints={animatedSnapPoints}
      handleHeight={animatedHandleHeight}
      contentHeight={animatedContentHeight}
    >
      <View onLayout={handleContentLayout}>
        {/* Dynamic content */}
      </View>
    </BottomSheetWrapper>
  );
}
```

## Advanced Usage

### Custom Backdrop

```typescript
import { BottomSheetBackdrop } from '@gymspace/sheet';
import { useCallback } from 'react';

function CustomBackdropSheet() {
  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  return (
    <BottomSheetWrapper
      sheetId="custom-backdrop"
      snapPoints={['50%']}
      backdropComponent={renderBackdrop}
    >
      {/* Content */}
    </BottomSheetWrapper>
  );
}
```

### Sheet Chaining

Opening one sheet from another:

```typescript
function FirstSheet() {
  const handleNext = () => {
    SheetManager.hide('first-sheet');
    SheetManager.show('second-sheet');
  };

  return (
    <BottomSheetWrapper sheetId="first-sheet" snapPoints={['50%']}>
      <View style={{ padding: 16 }}>
        <Button title="Next" onPress={handleNext} />
      </View>
    </BottomSheetWrapper>
  );
}
```

### Conditional Sheet Registration

```typescript
// Register sheets conditionally
export function registerSheets() {
  SheetManager.register('user-sheet', UserSheet);

  if (__DEV__) {
    SheetManager.register('debug-sheet', DebugSheet);
  }

  if (Platform.OS === 'ios') {
    SheetManager.register('ios-specific-sheet', IOSSheet);
  }
}
```

## Best Practices

### 1. Sheet Registration

- Register all sheets at app startup
- Use descriptive, unique IDs for sheets
- Group related sheets in the same file

### 2. Performance

- Use `React.memo` for sheet components when appropriate
- Implement proper `keyExtractor` for list sheets
- Use `getItemLayout` for fixed-height list items

### 3. User Experience

- Always provide a way to close sheets (close button or pan-down gesture)
- Use appropriate snap points for your content
- Consider keyboard avoidance for forms
- Test on different device sizes

### 4. Error Handling

```typescript
// Always check if sheet is registered before showing
if (SheetManager.isRegistered('my-sheet')) {
  SheetManager.show('my-sheet');
} else {
  console.warn('Sheet my-sheet is not registered');
}
```

## Migration from v1

If you're migrating from the old sheet system:

1. **Update imports:**
   ```typescript
   // Old
   import ActionSheet, { SheetProps } from '@gymspace/action-sheet';

   // New
   import { BottomSheetWrapper, SheetProps, SheetManager } from '@gymspace/sheet';
   ```

2. **Update component structure:**
   ```typescript
   // Old
   <ActionSheet id={sheetId}>
     <ScrollView>
       {/* Content */}
     </ScrollView>
   </ActionSheet>

   // New
   <BottomSheetWrapper sheetId="sheet-id" scrollable snapPoints={['50%']}>
     {/* Content - ScrollView is automatic with scrollable prop */}
   </BottomSheetWrapper>
   ```

3. **Update props interface:**
   ```typescript
   // Old
   interface Props extends SheetProps<'sheet-name'> {
     // ...
   }

   // New
   interface Props extends SheetProps {
     // ...
   }
   ```

## Troubleshooting

### Common Issues

1. **Sheet not appearing:** Make sure `SheetProvider` wraps your app and the sheet is registered.

2. **Gesture conflicts:** When using scrollable content, always use `BottomSheetScrollView` or `BottomSheetFlatList`.

3. **Android keyboard issues:** The library handles keyboard avoidance automatically, but make sure you're using the correct scroll components.

4. **Performance on large lists:** Use `BottomSheetFlatList` with proper `keyExtractor` and consider implementing `getItemLayout`.

### Debug Mode

Enable debug logging in development:

```typescript
// In your app initialization
if (__DEV__) {
  // Enable debug logs for @gorhom/bottom-sheet
  console.log('Sheet debug mode enabled');
}
```

## Contributing

Please read our contributing guidelines and ensure all tests pass before submitting a PR.

## License

MIT License - see LICENSE file for details.

## Changelog

### v2.0.0
- Complete rewrite using @gorhom/bottom-sheet v5
- Improved performance and gesture handling
- New hook-based API
- Better TypeScript support
- Breaking changes from v1 - see migration guide

### v1.x
- Legacy implementation (deprecated)