import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { ArrowLeftIcon } from 'lucide-react-native';
import { router } from 'expo-router';

interface ScreenFormProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  
  // Fixed footer props
  showFixedFooter?: boolean;
  footerContent?: React.ReactNode;
  
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
  className = '',
  contentClassName = '',
  headerActions,
  useSafeArea = true,
}) => {
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

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
          paddingBottom: showFixedFooter && footerContent ? 100 : 0,
          paddingTop: 0
        }}
      >
        <VStack space="md" className={`p-4 ${contentClassName}`}>
          {children}
        </VStack>
      </ScrollView>

      {/* Fixed Footer */}
      {showFixedFooter && footerContent && (
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4">
          {footerContent}
        </View>
      )}
    </View>
  );

  return (
    <ContentWrapper className={`flex-1 bg-white ${className}`}>
      {content}
    </ContentWrapper>
  );
};