import React, { useState, useMemo } from 'react';
import { View, Platform, Modal, TouchableWithoutFeedback, ActivityIndicator, TextInput } from 'react-native';
import { useController } from 'react-hook-form';
import type { UseControllerProps, FieldValues } from 'react-hook-form';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { FormControl, FormControlError, FormControlErrorText, FormControlHelper, FormControlHelperText } from '@/components/ui/form-control';
import { Button, ButtonText } from '@/components/ui/button';
import { Pressable } from '@/components/ui/pressable';
import { Icon } from '@/components/ui/icon';
import { ChevronDownIcon, XIcon, SearchIcon, PackageIcon } from 'lucide-react-native';
import { ScrollView } from 'react-native';
import { usePlansController } from '../controllers/plans.controller';
import { useFormatPrice } from '@/config/ConfigContext';
import type { MembershipPlan } from '@gymspace/sdk';

interface PlanListSelectorProps<TFieldValues extends FieldValues = FieldValues> 
  extends UseControllerProps<TFieldValues> {
  label?: string;
  description?: string;
  placeholder?: string;
  enabled?: boolean;
  allowClear?: boolean;
  activeOnly?: boolean;
  onPlanSelect?: (plan: MembershipPlan | null) => void;
}

export function PlanListSelector<TFieldValues extends FieldValues = FieldValues>({ 
  name, 
  control,
  rules,
  defaultValue,
  shouldUnregister,
  label = 'Plan de membresía', 
  description,
  placeholder = 'Seleccionar plan',
  enabled = true,
  allowClear = false,
  activeOnly = true,
  onPlanSelect
}: PlanListSelectorProps<TFieldValues>) {
  const { field, fieldState } = useController({ 
    name, 
    control,
    rules,
    defaultValue,
    shouldUnregister
  });
  
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tempValue, setTempValue] = useState(field.value || '');
  
  const { usePlansList, usePlanDetail } = usePlansController();
  const formatPrice = useFormatPrice();
  
  // Fetch plans list
  const { data: plansData, isLoading, error } = usePlansList({
    activeOnly: activeOnly
  });
  
  // Fetch selected plan details
  const { data: selectedPlan } = usePlanDetail(field.value as string);
  
  // Filter plans based on search
  const filteredPlans = useMemo(() => {
    const plans = plansData || [];
    if (!searchQuery) return plans;
    
    const lowerQuery = searchQuery.toLowerCase();
    return plans.filter(plan => 
      plan.name.toLowerCase().includes(lowerQuery) ||
      (plan.description && plan.description.toLowerCase().includes(lowerQuery))
    );
  }, [plansData, searchQuery]);
  
  const handleSave = () => {
    field.onChange(tempValue);
    const selectedPlan = filteredPlans.find(p => p.id === tempValue);
    onPlanSelect?.(selectedPlan || null);
    setShowModal(false);
  };
  
  const handleCancel = () => {
    setTempValue(field.value || '');
    setSearchQuery('');
    setShowModal(false);
  };
  
  const handleClear = () => {
    field.onChange('');
    onPlanSelect?.(null);
  };
  
  const openModal = () => {
    if (enabled) {
      setTempValue(field.value || '');
      setSearchQuery('');
      setShowModal(true);
    }
  };
  
  const handlePlanPress = (planId: string) => {
    setTempValue(planId);
  };
  
  const getDurationText = (plan: MembershipPlan) => {
    if (plan.durationMonths && plan.durationMonths > 0) {
      return `${plan.durationMonths} ${plan.durationMonths === 1 ? 'mes' : 'meses'}`;
    }
    if (plan.durationDays && plan.durationDays > 0) {
      return `${plan.durationDays} ${plan.durationDays === 1 ? 'día' : 'días'}`;
    }
    return 'Sin duración definida';
  };
  
  return (
    <>
      <FormControl isInvalid={!!fieldState.error}>
        <VStack className="gap-1">
          {label && <Text className="font-medium text-gray-900">{label}</Text>}
          
          {description && (
            <FormControlHelper>
              <FormControlHelperText>{description}</FormControlHelperText>
            </FormControlHelper>
          )}
          
          <Pressable
            onPress={openModal}
            disabled={!enabled}
          >
            <View className={`
              bg-white 
              border 
              ${fieldState.error ? 'border-red-500' : 'border-gray-300'} 
              rounded-lg 
              px-4
              py-4
              min-h-[60px]
              ${!enabled ? 'opacity-50' : ''}
            `}>
              <HStack className="justify-between items-center flex-1">
                {selectedPlan ? (
                  <VStack className="flex-1 gap-0.5">
                    <Text className="text-gray-900 font-medium">{selectedPlan.name}</Text>
                    <HStack className="gap-2">
                      <Text className="text-xs text-gray-500">
                        {formatPrice(selectedPlan.basePrice || 0)}
                      </Text>
                      <Text className="text-xs text-gray-500">•</Text>
                      <Text className="text-xs text-gray-500">
                        {getDurationText(selectedPlan)}
                      </Text>
                    </HStack>
                  </VStack>
                ) : (
                  <Text className="flex-1 text-gray-400">{placeholder}</Text>
                )}
                <HStack className="gap-2 items-center">
                  {allowClear && field.value && (
                    <Pressable 
                      onPress={(e) => {
                        e.stopPropagation();
                        handleClear();
                      }}
                      className="p-1"
                    >
                      <Icon as={XIcon} className="text-gray-400" size="sm" />
                    </Pressable>
                  )}
                  <Icon as={ChevronDownIcon} className="text-gray-400" size="md" />
                </HStack>
              </HStack>
            </View>
          </Pressable>
          
          {fieldState.error && (
            <FormControlError>
              <FormControlErrorText>{fieldState.error.message}</FormControlErrorText>
            </FormControlError>
          )}
        </VStack>
      </FormControl>
      
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View className="flex-1 bg-black/50">
          <TouchableWithoutFeedback onPress={handleCancel}>
            <View className="flex-1" />
          </TouchableWithoutFeedback>
          
          <View className="bg-white rounded-t-3xl h-5/6">
            {/* Header */}
            <View className="px-6 py-4 border-b border-gray-200">
              <HStack className="justify-between items-center mb-4">
                <Text className="text-lg font-semibold text-gray-900">
                  {label || 'Seleccionar plan'}
                </Text>
                <Pressable onPress={handleCancel} className="p-1">
                  <Icon as={XIcon} className="text-gray-400" size="md" />
                </Pressable>
              </HStack>
              
              {/* Search Bar */}
              <View className="relative">
                <View className="absolute left-3 top-3 z-10">
                  <Icon as={SearchIcon} className="text-gray-400" size="sm" />
                </View>
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Buscar por nombre..."
                  placeholderTextColor="#9CA3AF"
                  className="bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-base"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
            
            {/* Plans List */}
            <ScrollView className="flex-1 px-6">
              {isLoading ? (
                <View className="py-8 items-center">
                  <ActivityIndicator size="large" color="#3b82f6" />
                  <Text className="mt-2 text-gray-500">Cargando planes...</Text>
                </View>
              ) : error ? (
                <View className="py-8 items-center">
                  <Text className="text-red-500">Error al cargar planes</Text>
                </View>
              ) : filteredPlans.length === 0 ? (
                <View className="py-8 items-center">
                  <Icon as={PackageIcon} className="text-gray-300 mb-2" size="xl" />
                  <Text className="text-gray-500">
                    {searchQuery ? 'No se encontraron planes' : 'No hay planes disponibles'}
                  </Text>
                </View>
              ) : (
                <VStack className="py-2 gap-1">
                  {filteredPlans.map((plan) => (
                    <Pressable
                      key={plan.id}
                      onPress={() => handlePlanPress(plan.id)}
                      className={`
                        p-4 rounded-lg border
                        ${tempValue === plan.id 
                          ? 'bg-blue-50 border-blue-400' 
                          : 'bg-white border-gray-200'
                        }
                      `}
                    >
                      <VStack className="gap-1">
                        <HStack className="justify-between items-start">
                          <VStack className="flex-1 gap-0.5">
                            <Text className={`font-medium ${
                              tempValue === plan.id ? 'text-blue-900' : 'text-gray-900'
                            }`}>
                              {plan.name}
                            </Text>
                            {plan.description && (
                              <Text className={`text-xs ${
                                tempValue === plan.id ? 'text-blue-700' : 'text-gray-500'
                              }`}>
                                {plan.description}
                              </Text>
                            )}
                            <HStack className="gap-3 mt-1">
                              <Text className={`text-sm font-semibold ${
                                tempValue === plan.id ? 'text-blue-800' : 'text-gray-700'
                              }`}>
                                {formatPrice(plan.basePrice || 0)}
                              </Text>
                              <Text className={`text-xs ${
                                tempValue === plan.id ? 'text-blue-700' : 'text-gray-500'
                              }`}>
                                • {getDurationText(plan)}
                              </Text>
                            </HStack>
                          </VStack>
                          {tempValue === plan.id && (
                            <View className="bg-blue-500 rounded-full w-5 h-5 items-center justify-center">
                              <Text className="text-white text-xs">✓</Text>
                            </View>
                          )}
                        </HStack>
                        {plan.features && plan.features.length > 0 && (
                          <VStack className="gap-0.5 mt-2">
                            {plan.features.slice(0, 2).map((feature, index) => (
                              <Text
                                key={index}
                                className={`text-xs ${
                                  tempValue === plan.id ? 'text-blue-700' : 'text-gray-600'
                                }`}
                              >
                                • {feature}
                              </Text>
                            ))}
                            {plan.features.length > 2 && (
                              <Text className={`text-xs ${
                                tempValue === plan.id ? 'text-blue-600' : 'text-gray-400'
                              }`}>
                                +{plan.features.length - 2} más...
                              </Text>
                            )}
                          </VStack>
                        )}
                        {plan.status === 'inactive' && (
                          <Text className="text-xs text-orange-600 font-medium mt-1">
                            Plan Inactivo
                          </Text>
                        )}
                      </VStack>
                    </Pressable>
                  ))}
                </VStack>
              )}
            </ScrollView>
            
            {/* Footer */}
            <View className="px-6 py-4 border-t border-gray-200">
              <HStack className="gap-3">
                <Button
                  variant="outline"
                  size="md"
                  onPress={handleCancel}
                  className="flex-1"
                >
                  <ButtonText>Cancelar</ButtonText>
                </Button>
                <Button
                  size="md"
                  onPress={handleSave}
                  className="flex-1"
                  disabled={!tempValue}
                >
                  <ButtonText>Seleccionar</ButtonText>
                </Button>
              </HStack>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}