import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  ActivityIcon,
  CheckCircleIcon,
  FileTextIcon,
  UserPlusIcon,
} from 'lucide-react-native';
import React from 'react';

interface ActivityItemProps {
  activity: any;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const getActivityIcon = () => {
    switch (activity.type) {
      case 'check_in':
        return CheckCircleIcon;
      case 'new_client':
        return UserPlusIcon;
      case 'new_contract':
        return FileTextIcon;
      default:
        return ActivityIcon;
    }
  };

  const getActivityColor = () => {
    switch (activity.type) {
      case 'check_in':
        return 'text-green-600';
      case 'new_client':
        return 'text-blue-600';
      case 'new_contract':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Ahora mismo';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (minutes < 1440) return `Hace ${Math.floor(minutes / 60)} horas`;
    return date.toLocaleDateString();
  };

  return (
    <HStack className="items-center gap-3 py-3">
      <Icon as={getActivityIcon()} className={`w-5 h-5 ${getActivityColor()}`} />
      <VStack className="flex-1">
        <Text className="text-sm font-medium text-gray-900">
          {activity.description}
        </Text>
        {activity.clientName && (
          <Text className="text-xs text-gray-600">{activity.clientName}</Text>
        )}
      </VStack>
      <Text className="text-xs text-gray-500">{formatTime(activity.timestamp)}</Text>
    </HStack>
  );
};