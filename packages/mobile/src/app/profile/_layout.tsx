import { Stack } from 'expo-router';
import { BackButton } from '@/shared/components/BackButton';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: '',
        title: 'Mi perfil',
        headerLeft: () => <BackButton />,
      }}
    />
  );
}
