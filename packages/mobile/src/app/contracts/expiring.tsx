import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Pressable } from 'react-native';
import { ContractsList } from '@/features/contracts/components/ContractsList';
import { Text } from '@/components/ui/text';
import { ContractStatus } from '@gymspace/sdk';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';

export default function ExpiringContractsScreen() {
    const availableStatuses = [
        { value: ContractStatus.EXPIRING_SOON, label: 'Por vencer' },
        { value: ContractStatus.EXPIRED, label: 'Vencidos' },
    ];

    return (
        <SafeAreaView className="flex-1 bg-gray-50" >
            <View className="flex-1">
                <HStack className="px-4 py-3 bg-white border-b border-gray-200 items-center">
                    <Pressable 
                        onPress={() => router.back()}
                        className="p-2 mr-2"
                    >
                        <Icon as={ArrowLeft} className="w-6 h-6 text-gray-700" />
                    </Pressable>
                    <Text className="text-lg font-semibold text-gray-800">
                        Contratos por vencer
                    </Text>
                </HStack>
                <ContractsList
                    filters={{ status: ContractStatus.EXPIRING_SOON }}
                    hideAddButton={true}
                    availableStatuses={availableStatuses}
                />
            </View>
        </SafeAreaView>
    );
}