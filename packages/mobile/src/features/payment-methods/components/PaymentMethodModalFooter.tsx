import React from 'react';
import { View } from 'react-native';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';

interface PaymentMethodModalFooterProps {
  onCancel: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
}

export function PaymentMethodModalFooter({ 
  onCancel, 
  onSave, 
  saveDisabled = false 
}: PaymentMethodModalFooterProps) {
  return (
    <View className="px-6 py-4 border-t border-gray-200">
      <HStack className="gap-3">
        <Button variant="outline" size="md" onPress={onCancel} className="flex-1">
          <ButtonText>Cancelar</ButtonText>
        </Button>
        <Button size="md" onPress={onSave} className="flex-1" disabled={saveDisabled}>
          <ButtonText>Seleccionar</ButtonText>
        </Button>
      </HStack>
    </View>
  );
}