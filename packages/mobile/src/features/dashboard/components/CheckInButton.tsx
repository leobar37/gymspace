import { Icon } from '@/components/ui/icon';
import { CheckCircleIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable } from 'react-native';
import { CheckInProvider, useCheckIn } from '../contexts/CheckInContext';
import { CheckInSheet } from './CheckInSheet';

// CheckInButton content component (consumes context)
const CheckInButtonContent: React.FC = () => {
  const { openSheet } = useCheckIn();

  return (
    <>
      {/* Floating Action Button */}
      <Pressable
        onPress={openSheet}
        className="absolute bottom-6 right-6 w-14 h-14 bg-green-600 rounded-full items-center justify-center shadow-lg"
        style={{
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
        }}
      >
        <Icon as={CheckCircleIcon} className="w-7 h-7 text-white" />
      </Pressable>

      {/* Check-in Sheet */}
      <CheckInSheet />
    </>
  );
};

// Main CheckInButton component with context provider
export const CheckInButton: React.FC = () => {
  return (
    <CheckInProvider>
      <CheckInButtonContent />
    </CheckInProvider>
  );
};
