import { useMultiScreenContext } from '@/components/ui/multi-screen';
import type { Client } from '@gymspace/sdk';
import React from 'react';
import { CheckInClientsList } from './CheckInClientsList';

export const ClientListScreen: React.FC = () => {
  const { router } = useMultiScreenContext();

  const handleSelectClient = (client: Client) => {
    try {
      // Navigate to registration screen with selected client
      router.navigate('registration', { props: { client } });
    } catch (error) {
      console.log('Error navigating to registration screen:', error);
    }
  };

  return (
    <CheckInClientsList onClientSelect={handleSelectClient} />
  );
};
