# Phase 1: MVP Development (Weeks 1-8)

## Overview
The MVP phase focuses on delivering core functionality that enables gym staff to perform essential daily operations through the mobile app. This phase establishes the foundation for authentication, client management, check-ins, and basic contract operations.

## Week 1-2: Project Setup & Architecture

### Objectives
- Establish robust project architecture
- Configure development environment
- Implement core infrastructure components

### Tasks

#### Project Configuration
```typescript
// Essential setup tasks
1. Expo project initialization with TypeScript
2. Configure ESLint, Prettier, and Husky
3. Setup path aliases for clean imports
4. Configure environment variables
5. Setup development scripts
```

#### Navigation Architecture
```typescript
// app/_layout.tsx - Root layout with auth check
export default function RootLayout() {
  const { isAuthenticated } = useAuth();
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders>
        <Stack>
          {!isAuthenticated ? (
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          ) : (
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          )}
        </Stack>
      </AppProviders>
    </GestureHandlerRootView>
  );
}
```

#### State Management Setup
```typescript
// src/store/auth.atoms.ts
export const authTokenAtom = atomWithStorage('authToken', null);
export const userAtom = atom<User | null>(null);
export const selectedGymAtom = atomWithStorage('selectedGym', null);
export const permissionsAtom = atom<string[]>([]);
```

#### API Integration Foundation
```typescript
// src/services/api.config.ts
export const createApiClient = () => {
  return new GymSpaceSdk({
    baseUrl: Config.API_URL,
    tokenStrategy: 'native',
    onTokenRefresh: async (newToken) => {
      await SecureStore.setItemAsync('authToken', newToken);
    },
  });
};
```

### Deliverables
- ✅ Configured Expo project with TypeScript
- ✅ Navigation structure with Expo Router
- ✅ State management with Jotai
- ✅ API SDK integration setup
- ✅ Base component library structure
- ✅ Development environment ready

## Week 3-4: Authentication & Client Management

### Objectives
- Implement secure authentication flow
- Build client management features
- Establish permission-based UI

### Authentication Implementation

#### Login Screen
```typescript
// app/(auth)/login.tsx
export default function LoginScreen() {
  const { control, handleSubmit } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });
  
  const loginMutation = useLogin();
  
  const onSubmit = async (data: LoginForm) => {
    try {
      await loginMutation.mutateAsync(data);
      router.replace('/(tabs)/dashboard');
    } catch (error) {
      showError('Invalid credentials');
    }
  };
  
  return (
    <KeyboardAvoidingView className="flex-1 bg-white">
      <View className="flex-1 justify-center px-6">
        <Logo />
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <Input
              label="Email"
              placeholder="email@example.com"
              keyboardType="email-address"
              {...field}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <Input
              label="Password"
              placeholder="••••••••"
              secureTextEntry
              {...field}
            />
          )}
        />
        <Button onPress={handleSubmit(onSubmit)}>
          Login
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
```

#### Biometric Authentication
```typescript
// src/hooks/useBiometric.ts
export function useBiometric() {
  const [isAvailable, setIsAvailable] = useState(false);
  
  useEffect(() => {
    checkBiometricAvailability();
  }, []);
  
  const authenticate = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access GymSpace',
      fallbackLabel: 'Use Password',
    });
    
    return result.success;
  };
  
  return { isAvailable, authenticate };
}
```

### Client Management Features

#### Client List Screen
```typescript
// app/(tabs)/clients/index.tsx
export default function ClientsScreen() {
  const { data, isLoading, fetchNextPage, hasNextPage } = useInfiniteClients();
  
  const renderClient = ({ item }: { item: Client }) => (
    <ClientCard
      client={item}
      onPress={() => router.push(`/clients/${item.id}`)}
    />
  );
  
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <SearchHeader onSearch={handleSearch} />
      <FlashList
        data={data?.pages.flatMap(page => page.data) ?? []}
        renderItem={renderClient}
        onEndReached={() => hasNextPage && fetchNextPage()}
        estimatedItemSize={80}
        refreshing={isLoading}
        onRefresh={refetch}
      />
    </SafeAreaView>
  );
}
```

#### Quick Client Registration
```typescript
// src/features/clients/components/QuickRegisterForm.tsx
export function QuickRegisterForm({ onSuccess }: Props) {
  const form = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
  });
  
  const createMutation = useCreateClient();
  
  const handleSubmit = async (data: ClientForm) => {
    try {
      const client = await createMutation.mutateAsync(data);
      onSuccess(client);
      showSuccess('Client registered successfully');
    } catch (error) {
      showError('Failed to register client');
    }
  };
  
  return (
    <View className="p-4">
      <Input
        control={form.control}
        name="name"
        label="Full Name"
        placeholder="John Doe"
      />
      <Input
        control={form.control}
        name="documentId"
        label="Document ID"
        placeholder="12345678"
      />
      <Input
        control={form.control}
        name="phone"
        label="Phone"
        placeholder="+1234567890"
        keyboardType="phone-pad"
      />
      <DatePicker
        control={form.control}
        name="birthDate"
        label="Birth Date"
      />
      <Button
        onPress={form.handleSubmit(handleSubmit)}
        loading={createMutation.isLoading}
      >
        Register Client
      </Button>
    </View>
  );
}
```

### Deliverables
- ✅ Login with email/password
- ✅ Biometric authentication support
- ✅ Multi-gym selection for users with access to multiple gyms
- ✅ Client listing with search and filters
- ✅ Client detail view
- ✅ Quick client registration form
- ✅ Permission-based UI elements

## Week 5-6: Check-in System

### Objectives
- Build efficient check-in interface
- Implement multiple check-in methods
- Create check-in history and analytics

### Check-in Implementation

#### Main Check-in Screen
```typescript
// app/(tabs)/checkins/index.tsx
export default function CheckInScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: todayCheckins } = useTodayCheckins();
  const checkInMutation = useCheckIn();
  
  const handleCheckIn = async (client: Client) => {
    try {
      await checkInMutation.mutateAsync(client.id);
      showSuccess(`${client.name} checked in successfully`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      showError('Check-in failed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };
  
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="p-4">
        <StatsCard
          title="Today's Check-ins"
          value={todayCheckins?.length ?? 0}
          icon="check-circle"
        />
      </View>
      
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by name or member number"
      />
      
      <ClientSearchResults
        query={searchQuery}
        onSelectClient={handleCheckIn}
        showMembershipStatus
      />
    </SafeAreaView>
  );
}
```

#### QR Code Scanner
```typescript
// src/features/checkins/components/QRScanner.tsx
export function QRScanner({ onScan }: Props) {
  const [hasPermission, setHasPermission] = useState(false);
  
  useEffect(() => {
    requestCameraPermission();
  }, []);
  
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    try {
      const clientId = parseQRCode(data);
      await onScan(clientId);
    } catch (error) {
      showError('Invalid QR code');
    }
  };
  
  if (!hasPermission) {
    return <NoCameraPermission />;
  }
  
  return (
    <View className="flex-1">
      <CameraView
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        className="flex-1"
      >
        <QROverlay />
      </CameraView>
    </View>
  );
}
```

#### Check-in History
```typescript
// src/features/checkins/components/CheckInHistory.tsx
export function CheckInHistory({ clientId }: Props) {
  const { data, isLoading } = useCheckInHistory(clientId);
  
  const groupedByDate = useMemo(() => {
    return groupCheckInsByDate(data ?? []);
  }, [data]);
  
  return (
    <SectionList
      sections={groupedByDate}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section }) => (
        <Text className="text-gray-600 font-medium px-4 py-2 bg-gray-50">
          {formatDate(section.date)}
        </Text>
      )}
      renderItem={({ item }) => (
        <CheckInItem
          checkIn={item}
          showTime
        />
      )}
    />
  );
}
```

### Deliverables
- ✅ Quick check-in by search
- ✅ Client membership validation
- ✅ Check-in confirmation with haptic feedback
- ✅ Today's check-in counter
- ✅ Check-in history view
- ✅ QR code scanner (optional)
- ✅ Offline check-in queue

## Week 7-8: Contract Management

### Objectives
- Implement contract viewing and creation
- Handle document uploads
- Establish contract approval workflow

### Contract Features

#### Contract List
```typescript
// app/(tabs)/contracts/index.tsx
export default function ContractsScreen() {
  const [filter, setFilter] = useState<ContractFilter>('active');
  const { data, isLoading } = useContracts({ status: filter });
  
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <SegmentedControl
        values={['active', 'pending', 'expired']}
        selectedIndex={filterToIndex(filter)}
        onChange={(index) => setFilter(indexToFilter(index))}
      />
      
      <FlashList
        data={data}
        renderItem={({ item }) => (
          <ContractCard
            contract={item}
            onPress={() => router.push(`/contracts/${item.id}`)}
            showClientInfo
            showExpiryWarning
          />
        )}
        estimatedItemSize={120}
        refreshing={isLoading}
      />
      
      <FAB
        icon="plus"
        onPress={() => router.push('/contracts/new')}
        visible={hasPermission('CONTRACTS_CREATE')}
      />
    </SafeAreaView>
  );
}
```

#### New Contract Creation
```typescript
// src/features/contracts/components/NewContractForm.tsx
export function NewContractForm({ clientId }: Props) {
  const { data: plans } = useMembershipPlans();
  const form = useForm<ContractForm>();
  const createMutation = useCreateContract();
  
  const handleSubmit = async (data: ContractForm) => {
    try {
      const contract = await createMutation.mutateAsync({
        ...data,
        gymClientId: clientId,
      });
      
      router.push(`/contracts/${contract.id}/documents`);
    } catch (error) {
      showError('Failed to create contract');
    }
  };
  
  return (
    <ScrollView className="flex-1 p-4">
      <MembershipPlanPicker
        control={form.control}
        name="membershipPlanId"
        plans={plans}
      />
      
      <DateRangePicker
        control={form.control}
        startName="startDate"
        endName="endDate"
        label="Contract Period"
      />
      
      <PricingSection
        control={form.control}
        selectedPlan={form.watch('membershipPlanId')}
        allowCustomPricing={selectedPlan?.allowsCustomPricing}
      />
      
      <PaymentFrequencyPicker
        control={form.control}
        name="paymentFrequency"
      />
      
      <TextArea
        control={form.control}
        name="notes"
        label="Notes"
        placeholder="Additional contract notes..."
      />
      
      <Button
        onPress={form.handleSubmit(handleSubmit)}
        loading={createMutation.isLoading}
      >
        Create Contract
      </Button>
    </ScrollView>
  );
}
```

#### Document Upload
```typescript
// src/features/contracts/components/DocumentUpload.tsx
export function DocumentUpload({ contractId }: Props) {
  const uploadMutation = useUploadDocument();
  
  const handleCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.8,
    });
    
    if (!result.canceled) {
      await uploadDocument(result.assets[0]);
    }
  };
  
  const handleGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    
    if (!result.canceled) {
      for (const asset of result.assets) {
        await uploadDocument(asset);
      }
    }
  };
  
  const uploadDocument = async (asset: ImagePickerAsset) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        type: 'image/jpeg',
        name: 'document.jpg',
      } as any);
      
      await uploadMutation.mutateAsync({
        contractId,
        formData,
        type: 'payment_receipt',
      });
      
      showSuccess('Document uploaded');
    } catch (error) {
      showError('Upload failed');
    }
  };
  
  return (
    <View className="p-4">
      <Button
        icon="camera"
        onPress={handleCamera}
        variant="outline"
      >
        Take Photo
      </Button>
      
      <Button
        icon="image"
        onPress={handleGallery}
        variant="outline"
        className="mt-2"
      >
        Choose from Gallery
      </Button>
    </View>
  );
}
```

### Deliverables
- ✅ Contract listing with filters
- ✅ Contract detail view
- ✅ New contract creation flow
- ✅ Membership plan selection
- ✅ Custom pricing support
- ✅ Document upload via camera/gallery
- ✅ Contract status management
- ✅ Basic validation and error handling

## Testing & Quality Assurance

### Week 8: Testing and Bug Fixes

#### Testing Coverage
```typescript
// Example test for check-in flow
describe('Check-in Flow', () => {
  it('should successfully check in an active member', async () => {
    const { getByText, getByPlaceholder } = render(<CheckInScreen />);
    
    const searchInput = getByPlaceholder('Search by name or member number');
    fireEvent.changeText(searchInput, 'John Doe');
    
    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
    });
    
    fireEvent.press(getByText('Check In'));
    
    await waitFor(() => {
      expect(mockCheckInApi).toHaveBeenCalledWith('client-123');
      expect(getByText('John Doe checked in successfully')).toBeTruthy();
    });
  });
});
```

### Testing Checklist
- [ ] Unit tests for all utilities and hooks
- [ ] Component tests for critical UI components  
- [ ] Integration tests for API calls
- [ ] Manual testing on iOS and Android devices
- [ ] Performance profiling with Flipper
- [ ] Accessibility audit
- [ ] Security review of authentication flow
- [ ] Error scenario testing

## Performance Metrics

### Target Metrics
- **App Launch Time**: < 2 seconds
- **Screen Navigation**: < 300ms
- **API Response**: < 500ms (with loading states)
- **Search Response**: < 100ms (local search)
- **Check-in Flow**: < 5 seconds total
- **Memory Usage**: < 100MB average

### Optimization Strategies
1. **Image Optimization**: Use WebP format, implement lazy loading
2. **List Performance**: FlashList for all lists, estimated item sizes
3. **Navigation**: Preload critical screens
4. **API Calls**: Implement request deduplication
5. **State Management**: Atom splitting for performance

## MVP Deliverables Summary

### Core Features Completed
1. ✅ **Authentication System**
   - Email/password login
   - Biometric authentication
   - Multi-gym support
   - Secure token storage

2. ✅ **Client Management**
   - Client search and listing
   - Client detail views
   - Quick registration
   - Document management

3. ✅ **Check-in System**
   - Quick search check-in
   - Membership validation
   - Check-in history
   - Daily statistics

4. ✅ **Contract Management**
   - Contract listing
   - New contract creation
   - Document uploads
   - Status tracking

### Technical Foundation
- ✅ Robust architecture with TypeScript
- ✅ Efficient state management with Jotai
- ✅ API integration with error handling
- ✅ Responsive UI with NativeWind
- ✅ Navigation with Expo Router
- ✅ Form validation with React Hook Form + Zod
- ✅ Performance optimization
- ✅ Basic offline support

### Ready for Beta Testing
The MVP provides essential functionality for gym staff to:
- Manage daily check-ins efficiently
- Access client information on-the-go
- Create and manage contracts
- Work with limited connectivity

## Next Steps
- Conduct internal testing with gym staff
- Gather feedback on core workflows
- Identify priority features for Phase 2
- Plan evaluation system implementation
- Design dashboard and analytics features