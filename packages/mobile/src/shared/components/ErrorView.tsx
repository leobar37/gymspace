import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Button, ButtonText } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react-native';

interface ErrorViewProps {
  title?: string;
  message?: string;
  error?: Error | unknown;
  onRetry?: () => void;
  onBack?: () => void;
  retryText?: string;
  backText?: string;
  showIcon?: boolean;
  iconColor?: string;
}

export const ErrorView: React.FC<ErrorViewProps> = ({
  title = 'Ocurrió un error',
  message = 'Algo salió mal. Por favor, intenta de nuevo.',
  error,
  onRetry,
  onBack,
  retryText = 'Reintentar',
  backText = 'Volver',
  showIcon = true,
  iconColor = 'text-red-500',
}) => {
  // Extract error message if error object is provided
  const errorMessage = error instanceof Error ? error.message : message;

  return (
    <View className="flex-1 justify-center items-center p-6">
      <VStack className="items-center gap-4 max-w-sm">
        {showIcon && (
          <View className="w-20 h-20 bg-red-50 rounded-full items-center justify-center">
            <Icon as={AlertCircle} className={`w-10 h-10 ${iconColor}`} />
          </View>
        )}

        <VStack className="items-center gap-2">
          <Text className="text-xl font-semibold text-gray-900 text-center">
            {title}
          </Text>
          <Text className="text-sm text-gray-600 text-center">
            {errorMessage}
          </Text>
        </VStack>

        <VStack className="gap-3 w-full mt-4">
          {onRetry && (
            <Button
              variant="solid"
              size="md"
              onPress={onRetry}
            >
              <Icon as={RefreshCw} className="w-4 h-4 text-white mr-2" />
              <ButtonText className="text-white">{retryText}</ButtonText>
            </Button>
          )}

          {onBack && (
            <Button
              variant="outline"
              size="md"
              onPress={onBack}
            >
              <Icon as={ArrowLeft} className="w-4 h-4 text-gray-700 mr-2" />
              <ButtonText>{backText}</ButtonText>
            </Button>
          )}
        </VStack>
      </VStack>
    </View>
  );
};