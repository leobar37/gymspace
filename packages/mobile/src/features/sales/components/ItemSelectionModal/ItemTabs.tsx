import React from 'react';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { PackageIcon, WrenchIcon } from 'lucide-react-native';
import type { ItemTab } from '../../types';

interface ItemTabsProps {
  selectedTab: ItemTab;
  onTabChange: (tab: ItemTab) => void;
}

export const ItemTabs: React.FC<ItemTabsProps> = ({ selectedTab, onTabChange }) => {
  return (
    <HStack className="p-2 bg-gray-100">
      <Pressable
        onPress={() => onTabChange('products')}
        className={`flex-1 py-2 px-4 rounded-lg ${
          selectedTab === 'products' ? 'bg-white shadow-sm' : ''
        }`}
      >
        <HStack className="items-center justify-center" space="sm">
          <Icon
            as={PackageIcon}
            className={`w-4 h-4 ${selectedTab === 'products' ? 'text-blue-600' : 'text-gray-500'}`}
          />
          <Text
            className={`font-medium ${
              selectedTab === 'products' ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            Productos
          </Text>
        </HStack>
      </Pressable>

      <Pressable
        onPress={() => onTabChange('services')}
        className={`flex-1 py-2 px-4 rounded-lg ${
          selectedTab === 'services' ? 'bg-white shadow-sm' : ''
        }`}
      >
        <HStack className="items-center justify-center" space="sm">
          <Icon
            as={WrenchIcon}
            className={`w-4 h-4 ${selectedTab === 'services' ? 'text-blue-600' : 'text-gray-500'}`}
          />
          <Text
            className={`font-medium ${
              selectedTab === 'services' ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            Servicios
          </Text>
        </HStack>
      </Pressable>
    </HStack>
  );
};