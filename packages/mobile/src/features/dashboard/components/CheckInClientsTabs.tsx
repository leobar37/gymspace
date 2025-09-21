import React from 'react';
import { Pressable } from '@/components/ui/pressable';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Badge, BadgeText } from '@/components/ui/badge';

interface CheckInClientsTabsProps {
  activeTab: 'pending' | 'completed';
  onChange: (tab: 'pending' | 'completed') => void;
  pendingCount: number;
  completedCount: number;
}

export const CheckInClientsTabs: React.FC<CheckInClientsTabsProps> = ({
  activeTab,
  onChange,
  pendingCount,
  completedCount,
}) => {
  return (
    <HStack className="gap-2 mb-4">
      <Pressable
        onPress={() => onChange('pending')}
        className={`flex-1 py-3 px-4 rounded-lg border ${
          activeTab === 'pending'
            ? 'bg-blue-50 border-blue-200'
            : 'bg-gray-50 border-gray-200'
        }`}
      >
        <HStack className="items-center justify-center gap-2">
          <Text
            className={`font-medium ${
              activeTab === 'pending' ? 'text-blue-700' : 'text-gray-600'
            }`}
          >
            Pendientes
          </Text>
          <Badge
            variant="solid"
            action={activeTab === 'pending' ? 'info' : 'muted'}
            size="sm"
          >
            <BadgeText className="text-base font-semibold">{pendingCount}</BadgeText>
          </Badge>
        </HStack>
      </Pressable>
      <Pressable
        onPress={() => onChange('completed')}
        className={`flex-1 py-3 px-4 rounded-lg border ${
          activeTab === 'completed'
            ? 'bg-green-50 border-green-200'
            : 'bg-gray-50 border-gray-200'
        }`}
      >
        <HStack className="items-center justify-center gap-2">
          <Text
            className={`font-medium ${
              activeTab === 'completed' ? 'text-green-700' : 'text-gray-600'
            }`}
          >
            Completados
          </Text>
          <Badge
            variant="solid"
            action={activeTab === 'completed' ? 'success' : 'muted'}
            size="sm"
          >
            <BadgeText className="text-base font-semibold">{completedCount}</BadgeText>
          </Badge>
        </HStack>
      </Pressable>
    </HStack>
  );
};
