# Expo Modern Stack

A modern React Native project setup with Expo and all the best libraries pre-configured and ready to use.

## 🚀 Stack

- **[Expo](https://expo.dev/)** - React Native framework and platform
- **[NativeWind](https://www.nativewind.dev/)** - TailwindCSS for React Native
- **[Expo Router](https://expo.github.io/router/)** - File-based routing
- **[React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)** - Smooth animations
- **[React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)** - Touch gestures
- **[Jotai](https://jotai.org/)** - Primitive and flexible state management
- **[React Hook Form](https://react-hook-form.com/)** - Performant forms with easy validation
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation
- **[TanStack Query](https://tanstack.com/query/)** - Powerful data synchronization
- **[Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)** - Encrypted storage

## 📁 Project Structure

```
expo-modern-stack/
├── app/                    # Expo Router pages
│   ├── _layout.tsx        # Root layout with providers
│   ├── index.tsx          # Home screen
│   └── examples.tsx       # Examples screen
├── src/
│   ├── api/               # API functions for TanStack Query
│   ├── components/        # Reusable components
│   ├── hooks/             # Custom hooks
│   ├── providers/         # App providers (Query, Jotai)
│   ├── schemas/           # Zod schemas
│   └── store/             # Jotai atoms
├── assets/                # Images and static files
├── global.css             # Global TailwindCSS styles
├── tailwind.config.js     # Tailwind configuration
├── babel.config.js        # Babel configuration
├── metro.config.js        # Metro bundler configuration
└── app.json              # Expo configuration
```

## 🏃‍♂️ Getting Started

### Prerequisites

- Node.js (v18 or newer)
- npm or yarn
- Expo Go app on your phone (for testing)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd expo-modern-stack
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npx expo start
```

4. Scan the QR code with Expo Go (Android) or Camera app (iOS)

## 📱 Running on Simulators

### iOS Simulator (Mac only)
```bash
npx expo run:ios
```

### Android Emulator
```bash
npx expo run:android
```

## 🎯 Usage Examples

### State Management with Jotai

```typescript
// Define atoms in src/store/atoms.ts
import { atom } from "jotai";

export const userAtom = atom<User | null>(null);
export const themeAtom = atom<"light" | "dark">("light");

// Use in components
import { useAtom } from "jotai";
import { userAtom } from "../store/atoms";

function MyComponent() {
  const [user, setUser] = useAtom(userAtom);
  // ...
}
```

### Forms with React Hook Form + Zod

```typescript
// Define schema
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Use in form
const { control, handleSubmit } = useForm({
  resolver: zodResolver(schema),
});
```

### Data Fetching with TanStack Query

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ["users"],
  queryFn: fetchUsers,
});
```

### Animations with Reanimated

```typescript
const rotation = useSharedValue(0);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ rotateZ: `${rotation.value}deg` }],
}));

rotation.value = withSpring(180);
```

### Secure Storage

```typescript
import * as SecureStore from "expo-secure-store";

// Save
await SecureStore.setItemAsync("token", "my-jwt-token");

// Retrieve
const token = await SecureStore.getItemAsync("token");
```

## 🛠️ Development

### Adding New Screens

Create a new file in the `app/` directory:

```typescript
// app/profile.tsx
export default function ProfileScreen() {
  return (
    <View className="flex-1 p-4">
      <Text>Profile Screen</Text>
    </View>
  );
}
```

### Creating Components

Add components to `src/components/`:

```typescript
// src/components/Button.tsx
export function Button({ title, onPress }) {
  return (
    <TouchableOpacity 
      className="bg-blue-500 px-4 py-2 rounded"
      onPress={onPress}
    >
      <Text className="text-white">{title}</Text>
    </TouchableOpacity>
  );
}
```

### Styling with NativeWind

Use TailwindCSS classes directly:

```typescript
<View className="flex-1 bg-gray-100 p-4">
  <Text className="text-2xl font-bold text-blue-500">
    Hello World
  </Text>
</View>
```

## 📦 Building for Production

### Preview Build (Recommended)

```bash
eas build --profile preview --platform all
```

### Production Build

```bash
eas build --profile production --platform all
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## to build

eas build --platform android --profile preview --local
