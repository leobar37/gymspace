import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { Divider } from '@/components/ui/divider';
import { Button, ButtonText } from '@/components/ui/button';
import {
  UserIcon,
  BuildingIcon,
  CreditCardIcon,
  BellIcon,
  LockIcon,
  HelpCircleIcon,
  LogOutIcon,
  ChevronRightIcon,
  SettingsIcon,
  FileTextIcon,
  TruckIcon,
  PackageIcon,
} from 'lucide-react-native';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { useCurrentSession } from '@/hooks/useCurrentSession';
import { useAuthToken } from '@/hooks/useAuthToken';
import { router } from 'expo-router';

interface MenuItemProps {
  icon: any;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  iconColor?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  iconColor = 'text-gray-600',
}) => {
  return (
    <Pressable onPress={onPress}>
      <HStack className="items-center py-3 px-4">
        <Icon as={icon} className={`w-5 h-5 ${iconColor} mr-3`} />
        <VStack className="flex-1">
          <Text className="text-gray-900 font-medium">{title}</Text>
          {subtitle && (
            <Text className="text-sm text-gray-500 mt-0.5">{subtitle}</Text>
          )}
        </VStack>
        {showArrow && (
          <Icon as={ChevronRightIcon} className="w-5 h-5 text-gray-400" />
        )}
      </HStack>
    </Pressable>
  );
};

export const ProfileMenu: React.FC = () => {
  const { clearAuth } = useGymSdk();
  const { clearStoredTokens } = useAuthToken();
  const { session, user, gym, clearSessionCache } = useCurrentSession();

  const handleLogout = async () => {
    try {
      // Clear auth from provider
      await clearAuth();
      // Clear stored tokens
      await clearStoredTokens();
      // Clear session cache
      clearSessionCache();
      // Navigate to onboarding
      router.replace('/(onboarding)');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if clearing fails, navigate to login to prevent stuck state
      router.replace('/(onboarding)');
    }
  };

  const menuSections = [
    {
      title: 'Gestión',
      items: [
        {
          icon: PackageIcon,
          title: 'Planes',
          subtitle: 'Gestiona planes de membresía',
          onPress: () => router.push('/plans'),
        },
        {
          icon: FileTextIcon,
          title: 'Contratos',
          subtitle: 'Gestiona contratos y membresías',
          onPress: () => router.push('/contracts'),
        },
        {
          icon: TruckIcon,
          title: 'Proveedores',
          subtitle: 'Gestiona proveedores de productos',
          onPress: () => router.push('/suppliers'),
        },
      ],
    },
    {
      title: 'Cuenta',
      items: [
        {
          icon: UserIcon,
          title: 'Mi Perfil',
          subtitle: 'Edita tu información personal',
          onPress: () => router.push('/profile/edit'),
        },
        {
          icon: BuildingIcon,
          title: 'Mi Gimnasio',
          subtitle: gym?.name || 'Configuración del gimnasio',
          onPress: () => router.push('/gym/settings'),
        },
      ],
    },
    {
      title: 'Suscripción',
      items: [
        {
          icon: CreditCardIcon,
          title: 'Plan y Facturación',
          subtitle: 'Gestiona tu suscripción',
          onPress: () => router.push('/subscription'),
        },
      ],
    },
    {
      title: 'Configuración',
      items: [
        {
          icon: BellIcon,
          title: 'Notificaciones',
          subtitle: 'Configura tus preferencias',
          onPress: () => router.push('/settings/notifications'),
        },
        {
          icon: LockIcon,
          title: 'Seguridad',
          subtitle: 'Contraseña y acceso',
          onPress: () => router.push('/settings/security'),
        },
        {
          icon: SettingsIcon,
          title: 'Preferencias',
          subtitle: 'Idioma y apariencia',
          onPress: () => router.push('/settings/preferences'),
        },
      ],
    },
    {
      title: 'Soporte',
      items: [
        {
          icon: HelpCircleIcon,
          title: 'Centro de Ayuda',
          subtitle: 'Guías y preguntas frecuentes',
          onPress: () => router.push('/support'),
        },
      ],
    },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <VStack className="pb-8">
        {/* Profile Header */}
        <Card className="m-4 p-6">
          <HStack className="items-center gap-4">
            <Avatar className="w-16 h-16 bg-blue-600">
              <Text className="text-white text-xl font-semibold">
                {user?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
              </Text>
            </Avatar>
            <VStack className="flex-1">
              <Text className="text-lg font-semibold text-gray-900">
                {user?.name || 'Usuario'}
              </Text>
              <Text className="text-sm text-gray-600">
                {user?.email || 'email@ejemplo.com'}
              </Text>
              <Text className="text-xs text-gray-500 mt-1">
                {user?.userType === 'owner' ? 'Propietario' : 'Colaborador'}
              </Text>
            </VStack>
          </HStack>
        </Card>

        {/* Menu Sections */}
        {menuSections.map((section, index) => (
          <VStack key={index} className="mt-6">
            <Text className="px-4 mb-2 text-sm font-medium text-gray-500 uppercase">
              {section.title}
            </Text>
            <Card className="mx-4">
              {section.items.map((item, itemIndex) => (
                <React.Fragment key={itemIndex}>
                  <MenuItem {...item} />
                  {itemIndex < section.items.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </Card>
          </VStack>
        ))}

        {/* Logout Button */}
        <View className="mx-4 mt-8">
          <Button
            onPress={handleLogout}
            variant="outline"
            className="w-full py-3"
          >
            <Icon as={LogOutIcon} className="text-red-600 mr-2" />
            <ButtonText className="text-red-600">Cerrar Sesión</ButtonText>
          </Button>
        </View>

        {/* App Version */}
        <Text className="text-center text-xs text-gray-500 mt-6">
          GymSpace v1.0.0
        </Text>
      </VStack>
    </ScrollView>
  );
};