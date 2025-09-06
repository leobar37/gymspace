import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
} from '@/components/ui/alert-dialog';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { AlertTriangleIcon } from 'lucide-react-native';
import React from 'react';

interface ClientStatusAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  client?: {
    name?: string;
    status?: string;
  };
  isToggling: boolean;
  error?: string | null;
}

export const ClientStatusAlert: React.FC<ClientStatusAlertProps> = ({
  isOpen,
  onClose,
  onConfirm,
  client,
  isToggling,
  error,
}) => {
  const isActive = client?.status === 'active';

  return (
    <AlertDialog isOpen={isOpen} onClose={onClose}>
      <AlertDialogBackdrop />
      <AlertDialogContent>
        <AlertDialogHeader>
          <HStack className="items-center gap-2">
            {error && <Icon as={AlertTriangleIcon} className="w-5 h-5 text-red-500" />}
            <Text className="text-lg font-semibold">
              {isActive ? 'Desactivar Cliente' : 'Activar Cliente'}
            </Text>
          </HStack>
          <AlertDialogCloseButton onPress={onClose} />
        </AlertDialogHeader>
        <AlertDialogBody>
          {error ? (
            <VStack className="gap-3">
              <Text className="text-red-600 font-medium">Error al cambiar el estado</Text>
              <Text className="text-gray-600">{error}</Text>
              {error.includes('contratos activos') && (
                <Card className="p-3 bg-yellow-50 border border-yellow-200">
                  <HStack className="items-start gap-2">
                    <Icon as={AlertTriangleIcon} className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <Text className="text-sm text-gray-700">
                      Para desactivar este cliente, primero debe cancelar o completar todos sus
                      contratos activos.
                    </Text>
                  </HStack>
                </Card>
              )}
            </VStack>
          ) : (
            <VStack className="gap-3">
              <Text className="text-gray-600">
                {isActive
                  ? `¿Estás seguro de que deseas desactivar a ${client?.name}?`
                  : `¿Estás seguro de que deseas activar a ${client?.name}?`}
              </Text>
              <Text className="text-sm text-gray-500">
                {isActive
                  ? 'El cliente no podrá acceder al gimnasio hasta que sea reactivado.'
                  : 'El cliente podrá acceder nuevamente al gimnasio.'}
              </Text>
            </VStack>
          )}
        </AlertDialogBody>
        <AlertDialogFooter>
          <Button variant="outline" onPress={onClose}>
            <ButtonText>Cancelar</ButtonText>
          </Button>
          {!error && (
            <Button
              action={isActive ? 'negative' : 'positive'}
              onPress={onConfirm}
              disabled={isToggling}
            >
              <ButtonText>{isActive ? 'Desactivar' : 'Activar'}</ButtonText>
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};