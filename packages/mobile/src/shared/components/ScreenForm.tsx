import React, { createContext, useContext, useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { View } from '@/components/ui/view';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { ArrowLeftIcon } from 'lucide-react-native';
import { router } from 'expo-router';

interface ScreenFormContextType {
  setFooterContent: (content: React.ReactNode) => void;
  setTotalDisplay: (config: { show: boolean; label?: string; value?: string; variant?: 'default' | 'success' | 'warning' | 'error' }) => void;
}

const ScreenFormContext = createContext<ScreenFormContextType | null>(null);

export const useScreenForm = () => {
  const context = useContext(ScreenFormContext);
  if (!context) {
    throw new Error('useScreenForm must be used within a ScreenForm');
  }
  return context;
};

interface ScreenFormProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  
  // Fixed footer props
  showFixedFooter?: boolean;
  footerContent?: React.ReactNode;
  actions?: React.ReactNode; // Legacy support
  
  // Total display props
  showTotal?: boolean;
  totalLabel?: string;
  totalValue?: string;
  totalVariant?: 'default' | 'success' | 'warning' | 'error';
  
  // Layout props
  className?: string;
  contentClassName?: string;
  headerActions?: React.ReactNode;
  useSafeArea?: boolean; // Control whether to use SafeAreaView
}

export const ScreenForm: React.FC<ScreenFormProps> = ({
  children,
  title,
  showBackButton = true,
  onBackPress,
  showFixedFooter = false,
  footerContent,
  actions, // Legacy support
  showTotal = false,
  totalLabel = 'Total',
  totalValue,
  totalVariant = 'default',
  className = '',
  contentClassName = '',
  headerActions,
  useSafeArea = true,
}) => {
  // State for dynamic footer content
  const [dynamicFooterContent, setDynamicFooterContent] = useState<React.ReactNode>(null);
  const [dynamicTotalConfig, setDynamicTotalConfig] = useState({
    show: showTotal,
    label: totalLabel,
    value: totalValue,
    variant: totalVariant as 'default' | 'success' | 'warning' | 'error'
  });

  // Context value
  const contextValue: ScreenFormContextType = {
    setFooterContent: setDynamicFooterContent,
    setTotalDisplay: (config) => {
      setDynamicTotalConfig(prev => ({ ...prev, ...config }));
    }
  };
  
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const getTotalCardStyles = (variant: string) => {
    switch (variant) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTotalTextStyles = (variant: string) => {
    switch (variant) {
      case 'success':
        return 'text-green-900';
      case 'warning':
        return 'text-yellow-900';
      case 'error':
        return 'text-red-900';
      default:
        return 'text-blue-900';
    }
  };

  // Priority: dynamic content > static props > legacy actions
  const finalFooterContent = dynamicFooterContent || footerContent || actions;
  const finalShowTotal = dynamicTotalConfig.show;
  const shouldShowFooter = showFixedFooter || finalShowTotal || finalFooterContent;

  const ContentWrapper = useSafeArea ? SafeAreaView : View;
  
  const content = (
    <View className="flex-1">
      {/* Header */}
      {(title || showBackButton || headerActions) && (
        <HStack className="justify-between items-center p-4 pb-2">
          {showBackButton ? (
            <HStack className="items-center flex-1">
              <Pressable
                onPress={handleBackPress}
                className="p-2 -ml-2 rounded-lg mr-2"
              >
                <Icon as={ArrowLeftIcon} className="w-6 h-6 text-gray-700" />
              </Pressable>
              {title && (
                <Text className="text-xl font-bold text-gray-900 flex-1">
                  {title}
                </Text>
              )}
            </HStack>
          ) : (
            title && (
              <Text className="text-xl font-bold text-gray-900 flex-1">
                {title}
              </Text>
            )
          )}
          
          {headerActions && (
            <View className="ml-auto">
              {headerActions}
            </View>
          )}
        </HStack>
      )}

      {/* Scrollable Content */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ 
          paddingBottom: shouldShowFooter ? 120 : 0,
          paddingTop: 0
        }}
      >
        <VStack space="md" className={`p-4 ${contentClassName}`}>
          {children}
        </VStack>
      </ScrollView>

      {/* Fixed Footer */}
      {shouldShowFooter && (
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          {finalShowTotal && dynamicTotalConfig.value && (
            <Card className={`m-4 mb-2 ${getTotalCardStyles(dynamicTotalConfig.variant)}`}>
              <HStack className="justify-between items-center p-4">
                <Text className={`text-xl font-semibold ${getTotalTextStyles(dynamicTotalConfig.variant)}`}>
                  {dynamicTotalConfig.label}
                </Text>
                <Text className={`text-3xl font-bold ${getTotalTextStyles(dynamicTotalConfig.variant)}`}>
                  {dynamicTotalConfig.value}
                </Text>
              </HStack>
            </Card>
          )}
          
          {finalFooterContent && (
            <View className={actions ? "px-7 pb-8 py-4" : "p-4"}>
              {finalFooterContent}
            </View>
          )}
        </View>
      )}
    </View>
  );

  return (
    <ScreenFormContext.Provider value={contextValue}>
      <ContentWrapper className={`flex-1 bg-gray-50 ${className}`}>
        {content}
      </ContentWrapper>
    </ScreenFormContext.Provider>
  );
};