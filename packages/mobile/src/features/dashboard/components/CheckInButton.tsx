import { Icon } from '@/components/ui/icon';
import { Fab } from '@/components/ui/fab';
import { SheetManager } from '@gymspace/sheet';
import { CheckCircleIcon } from 'lucide-react-native';
import React from 'react';

export const CheckInButton: React.FC = () => {
  return (
    <Fab
      onPress={() => SheetManager.show('check-in')}
      className="absolute bottom-6 right-6"
    >
      <Icon as={CheckCircleIcon} className="w-7 h-7" />
    </Fab>
  );
};
