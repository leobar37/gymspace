import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { ClockIcon } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { ActivityItem } from './ActivityItem';

interface Activity {
  id: string;
  type: string;
  timestamp: string;
  // Add other relevant fields here
}

interface RecentActivityProps {
  recentActivity: Activity[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  recentActivity,
}) => {
  return (
    <Card className="p-4">
      <VStack className="gap-3">
        <HStack className="items-center justify-between mb-2">
          <Heading className="text-lg font-semibold text-gray-900">
            Actividad Reciente
          </Heading>
          <Icon as={ClockIcon} className="w-5 h-5 text-gray-400" />
        </HStack>

        {recentActivity && recentActivity.length > 0 ? (
          <View>
            {recentActivity.map((activity, index) => (
              <React.Fragment key={index}>
                <ActivityItem activity={activity} />
                {index < recentActivity.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </View>
        ) : (
          <Text className="text-center text-gray-500 py-4">
            No hay actividad reciente
          </Text>
        )}
      </VStack>
    </Card>
  );
};