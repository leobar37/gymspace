import { Heading } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { X } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { BottomSheetWrapper, SheetManager, SheetProps } from '@gymspace/sheet';
import { ContractRenewalForm } from './ContractRenewalForm';

interface ContractRenewalDrawerProps extends SheetProps {
  contract?: any;
  onSuccess?: () => void;
}

export const ContractRenewalDrawer: React.FC<ContractRenewalDrawerProps> = (props) => {
  return (
    <BottomSheetWrapper
      sheetId="contract-renewal"
      snapPoints={['90%']}
      enablePanDownToClose
      scrollable
    >
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
        <Heading size="lg">Renovar Contrato</Heading>
        <Pressable onPress={() => SheetManager.hide('contract-renewal')} className="p-2">
          <Icon as={X} size="md" className="text-gray-500" />
        </Pressable>
      </View>

      {props.contract && <ContractRenewalForm contract={props.contract} onSuccess={props.onSuccess} />}
    </BottomSheetWrapper>
  );
};

ContractRenewalDrawer.displayName = 'ContractRenewalDrawer';
