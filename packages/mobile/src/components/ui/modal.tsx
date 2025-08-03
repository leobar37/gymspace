import React from 'react';
import { Modal as RNModal, View, Text, Pressable, ScrollView } from 'react-native';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export function Modal({ isOpen, onClose, children, title, size = 'md' }: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-full mx-4',
  };

  return (
    <RNModal
      animationType="fade"
      transparent={true}
      visible={isOpen}
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 justify-center items-center bg-black/50"
        onPress={onClose}
      >
        <Pressable
          className={cn(
            'bg-white rounded-lg p-6 w-full',
            sizeClasses[size],
            'shadow-xl'
          )}
          onPress={(e) => e.stopPropagation()}
        >
          {title && (
            <View className="mb-4">
              <Text className="text-xl font-semibold">{title}</Text>
            </View>
          )}
          <ScrollView 
            showsVerticalScrollIndicator={false}
            className="max-h-96"
          >
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <View className={cn('flex-row justify-end space-x-2 mt-4', className)}>
      {children}
    </View>
  );
}