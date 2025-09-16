# Expo SDK 54 Migration Guide

## Overview
This document details the migration process from Expo SDK 53 to SDK 54, including all breaking changes, deprecations, and required updates for the Gymspace project.

## Key Changes

### 🚨 Breaking Changes

#### 1. React Native Version Update
- **From**: React Native 0.74.x
- **To**: React Native 0.76.x (SDK 54 uses RN 0.76)
- **Impact**: Major version jump with significant changes

#### 2. React Version Update
- **From**: React 18.x
- **To**: React 19.x
- **Impact**: New React features and potential breaking changes in lifecycle methods

#### 3. React Native Reanimated v4
- **Change**: Reanimated v4 separated worklets into `react-native-worklets` package
- **Babel Plugin Migration**:
  - Old: `react-native-reanimated/plugin`
  - New: `react-native-worklets/plugin`
- **Status**: ✅ Already fixed in `packages/mobile/babel.config.js`

#### 4. Legacy Architecture Support
- **Important**: SDK 54 is the **final release** to include Legacy Architecture support
- **Future**: React Native 0.82 will remove the ability to opt out of New Architecture
- **Recommendation**: Start migrating to New Architecture now

### ⚠️ Deprecations & Removals

#### Deprecated Components
1. **SafeAreaView from React Native**
   - Status: Deprecated
   - Alternative: Use `react-native-safe-area-context`

2. **expo-av**
   - Will be removed in SDK 55
   - Alternative: Consider migrating to other audio/video solutions

3. **Notification Configuration**
   - The notification configuration field in app config is deprecated
   - Use new notification APIs

#### Removed Dependencies
- `react-native-edge-to-edge` is no longer a dependency
- Edge-to-edge is now always enabled on Android

### 📦 Required Updates

#### Dependencies to Update
```json
{
  "expo": "~54.0.0",
  "react": "19.1.0",
  "react-native": "0.76.x",
  "react-native-reanimated": "~4.1.0",
  "react-native-worklets": "^0.5.1",
  "babel-preset-expo": "~54.0.0"
}
```

#### Babel Configuration
```javascript
// packages/mobile/babel.config.js
module.exports = {
  presets: [
    ['babel-preset-expo', {
      jsxImportSource: 'nativewind',
    }],
    'nativewind/babel'
  ],
  plugins: [
    // ... other plugins
    'react-native-worklets/plugin' // New plugin location for Reanimated v4
  ]
};
```

### 🔧 Configuration Changes

#### Android Configuration
1. **Edge-to-Edge**: Now always enabled (no configuration needed)
2. **Predictive Back Gesture**: Available as opt-in
   ```json
   // app.json or app.config.js
   {
     "android": {
       "predictiveBackGestureEnabled": true
     }
   }
   ```

#### iOS Configuration
- **Xcode Requirement**: Xcode 26 required for new features
- **Icon Support**: New icon format available via Icon Composer

### 🚀 Migration Steps

#### Step 1: Clean Native Directories (CRITICAL)

**If you use Continuous Native Generation:**
```bash
# Delete the android and ios directories if you generated them for a previous SDK version
cd packages/mobile
rm -rf android
rm -rf ios

# They'll be re-generated next time you run a build with:
# npx expo run:ios
# npx expo run:android
# npx expo prebuild
# or with EAS Build
```

**If you don't use Continuous Native Generation:**
- Run `npx expo prebuild --clean` to delete and re-generate the native directories from scratch
- Alternatively, manually apply any necessary native changes

#### Step 2: Clean Installation
```bash
# Remove existing dependencies and caches
cd packages/mobile
rm -rf node_modules
rm -rf .expo
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/react-*

# Remove lock file from root
cd ../..
rm -rf pnpm-lock.yaml
```

#### Step 3: Update Dependencies
```bash
# Install fresh dependencies
pnpm install

# Fix any dependency issues
cd packages/mobile
npx expo install --fix
```

#### Step 4: Verify Installation
```bash
# Check for compatibility issues
npx expo-doctor@latest

# Verify native modules
npx expo-modules-autolinking verify -v
```

#### Step 5: Clear Metro Cache and Start
```bash
npx expo start -c
```

### ✅ Completed Migrations

1. **Babel Plugin Update**: ✅ Updated to use `react-native-worklets/plugin`
2. **File Structure**: ✅ Moved Expo config files from root to mobile package
3. **Dependencies**: ✅ Updated to SDK 54 compatible versions

### ⚠️ Known Issues

1. **Precompiled React Native for iOS**
   - Not compatible with `use_frameworks!`
   - Solution: Use modular headers if needed

2. **New Architecture Migration**
   - 75% of SDK 53 projects already use New Architecture
   - Consider enabling it if not already done

### ⚠️ Important Notes on Native Directories

**Continuous Native Generation (CNG)**:
- If you're using CNG (managed workflow), you should **NOT** have `android/` and `ios/` directories committed to version control
- These directories should be regenerated fresh for each SDK upgrade
- Always delete them before upgrading and let Expo regenerate them

**Bare/Ejected Workflow**:
- If you have custom native code, use `npx expo prebuild --clean` to safely regenerate while preserving customizations
- Review native changes carefully after regeneration

### 📋 Testing Checklist

- [ ] Native directories regenerated (if using CNG)
- [ ] App builds successfully on Android
- [ ] App builds successfully on iOS
- [ ] All animations work (Reanimated v4)
- [ ] Navigation works correctly
- [ ] Forms and inputs function properly
- [ ] API calls work as expected
- [ ] No console warnings about deprecated APIs
- [ ] Performance is acceptable

### 🔗 Resources

- [Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54)
- [React Native 0.76 Release Notes](https://reactnative.dev/blog)
- [React 19 Migration Guide](https://react.dev/blog)
- [Reanimated v4 Migration](https://docs.swmansion.com/react-native-reanimated/docs/guides/migration-from-3.x)

### 📝 Notes

- The error "Reanimated Babel plugin moved to react-native-worklets" was due to the architectural change in Reanimated v4
- Expo config files (app.json, eas.json) should remain in the mobile package, not in the root
- Always clear Metro cache after major upgrades to avoid bundling issues

## Post-Migration Tasks

1. **Monitor for Deprecation Warnings**: Check console for any remaining deprecation warnings
2. **Update CI/CD**: Ensure build pipelines use correct Node and Expo CLI versions
3. **Test on Physical Devices**: Verify app works on actual iOS and Android devices
4. **Performance Testing**: Compare app performance before and after migration
5. **Consider New Architecture**: Plan migration to New Architecture before SDK 55