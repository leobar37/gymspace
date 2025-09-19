import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { BarChart3Icon, CheckCircleIcon, UserIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, View } from 'react-native';

export type TabType = 'info' | 'checkins' | 'stats';

interface ClientTabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const ClientTabNavigation: React.FC<ClientTabNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs = [
    { id: 'info' as TabType, label: 'Información', icon: UserIcon },
    { id: 'checkins' as TabType, label: 'Check-ins', icon: CheckCircleIcon },
    { id: 'stats' as TabType, label: 'Estadísticas', icon: BarChart3Icon },
  ];

  return (
    <View>
      <HStack className="px-4">
        {tabs.map((tab) => (
          <Pressable
            key={tab.id}
            onPress={() => onTabChange(tab.id)}
            className={`flex-1 py-3 border-b-2 ${
              activeTab === tab.id ? 'border-blue-600' : 'border-transparent'
            }`}
          >
            <HStack className="items-center justify-center gap-2">
              <Icon
                as={tab.icon}
                className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-500'}`}
              />
              <Text
                className={`font-medium ${
                  activeTab === tab.id ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                {tab.label}
              </Text>
            </HStack>
          </Pressable>
        ))}
      </HStack>
    </View>
  );
};
