import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, ListRenderItem } from 'react-native';
import { useController, Control, useFormContext } from 'react-hook-form';
import { usePlansController } from '../controllers/plans.controller';
import { Spinner } from '@/components/ui/spinner';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Check, ChevronDown } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { useFormatPrice } from '@/config/ConfigContext';
import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { 
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetFlatList 
} from '@/components/ui/actionsheet';

interface PlanSelectorProps {
  control?: Control<any>;
  name: string;
  label?: string;
  onPlanSelect?: (plan: any) => void;
  activeOnly?: boolean;
}

export const PlanSelector: React.FC<PlanSelectorProps> = ({
  control,
  name,
  label = 'Seleccionar plan',
  onPlanSelect,
  activeOnly = true,
}) => {
  const formatPrice = useFormatPrice();
  const formContext = useFormContext();
  const actualControl = control || formContext.control;
  
  const { field, fieldState } = useController({
    control: actualControl,
    name,
    rules: { required: 'El plan es requerido' },
  });

  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [optimisticSelection, setOptimisticSelection] = useState<string | null>(null);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  
  const { usePlansList } = usePlansController();
  const { data: plans, isLoading } = usePlansList({
    activeOnly: activeOnly,
  });

  const handlePlanSelect = useCallback((plan: any) => {
    // Set optimistic selection immediately
    setOptimisticSelection(plan.id);
    
    // Update form field
    field.onChange(plan.id);
    
    // Store selected plan for price summary
    setSelectedPlan(plan);
    
    // Call onPlanSelect if provided
    if (onPlanSelect) {
      onPlanSelect(plan);
    }
    
    // Close the actionsheet
    setShowPlanSelector(false);
    
    // Clear optimistic selection after a short delay
    setTimeout(() => {
      setOptimisticSelection(null);
    }, 300);
  }, [field, onPlanSelect]);

  const selectedPlanId = optimisticSelection || field.value;

  const sortedPlans = useMemo(() => {
    if (!plans) return [];
    const plansList = Array.isArray(plans) ? plans : (plans as any)?.data || [];
    return [...plansList].sort((a: any, b: any) => {
      // Sort by price (ascending)
      return (Number(a.basePrice) || 0) - (Number(b.basePrice) || 0);
    });
  }, [plans]);

  // Update selected plan when field value changes or plans load
  useEffect(() => {
    if (field.value && sortedPlans.length > 0) {
      const plan = sortedPlans.find((p: any) => p.id === field.value);
      if (plan) {
        setSelectedPlan(plan);
      }
    }
  }, [field.value, sortedPlans]);

  const renderPlanItem: ListRenderItem<any> = ({ item: plan }) => {
    const isSelected = selectedPlanId === plan.id;
    const durationText = plan.durationMonths
      ? `${plan.durationMonths} ${plan.durationMonths === 1 ? 'mes' : 'meses'}`
      : plan.durationDays
      ? `${plan.durationDays} ${plan.durationDays === 1 ? 'día' : 'días'}`
      : 'Sin duración';

    return (
      <Pressable
        onPress={() => handlePlanSelect(plan)}
        disabled={optimisticSelection !== null && optimisticSelection !== plan.id}
        className="mx-4 my-2"
      >
        <Card className={`${isSelected ? 'border-2 border-blue-500' : 'border border-gray-200'}`}>
          <View className="p-3">
            <HStack className="justify-between items-start">
              <VStack className="flex-1 gap-1">
                <Text className="font-semibold text-base">{plan.name}</Text>
                <Text className="text-sm text-gray-600">{durationText}</Text>
                {plan.description && (
                  <Text className="text-xs text-gray-500" numberOfLines={2}>
                    {plan.description}
                  </Text>
                )}
              </VStack>
              
              <HStack className="items-center gap-2">
                <VStack className="items-end">
                  <Text className="font-bold text-lg">
                    {formatPrice(Number(plan.basePrice) || 0)}
                  </Text>
                </VStack>
                
                {isSelected && (
                  <View className="w-6 h-6 rounded-full bg-blue-500 items-center justify-center">
                    <Icon as={Check} className="text-white" size="xs" />
                  </View>
                )}
              </HStack>
            </HStack>
          </View>
        </Card>
      </Pressable>
    );
  };

  // Display selected plan info
  const getSelectedPlanDisplay = () => {
    if (selectedPlan) {
      const durationText = selectedPlan.durationMonths
        ? `${selectedPlan.durationMonths} ${selectedPlan.durationMonths === 1 ? 'mes' : 'meses'}`
        : selectedPlan.durationDays
        ? `${selectedPlan.durationDays} ${selectedPlan.durationDays === 1 ? 'día' : 'días'}`
        : 'Sin duración';
      
      return (
        <HStack className="justify-between items-center flex-1">
          <VStack className="flex-1">
            <Text className="font-medium text-base">{selectedPlan.name}</Text>
            <Text className="text-sm text-gray-500">{durationText} - {formatPrice(selectedPlan.basePrice || 0)}</Text>
          </VStack>
          <Icon as={ChevronDown} className="text-gray-400" size="sm" />
        </HStack>
      );
    }
    
    return (
      <HStack className="justify-between items-center flex-1">
        <Text className="text-gray-500">Seleccionar un plan</Text>
        <Icon as={ChevronDown} className="text-gray-400" size="sm" />
      </HStack>
    );
  };

  return (
    <>
      <VStack className="gap-2">
        {label && (
          <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
        )}
        
        {/* Plan Selector Button */}
        <Pressable onPress={() => setShowPlanSelector(true)}>
          <Card className="border border-gray-200">
            <View className="p-3">
              {isLoading ? (
                <HStack className="justify-center items-center">
                  <Spinner size="small" />
                </HStack>
              ) : (
                getSelectedPlanDisplay()
              )}
            </View>
          </Card>
        </Pressable>

        {fieldState.error && (
          <Text className="text-red-500 text-xs mt-1">{fieldState.error.message}</Text>
        )}
      </VStack>

      {/* Plan Selection Actionsheet */}
      <Actionsheet isOpen={showPlanSelector} onClose={() => setShowPlanSelector(false)}>
        <ActionsheetBackdrop />
        <ActionsheetContent className="h-[70%]">
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          
          <View className="w-full px-4 pb-4">
            <Heading size="md" className="mb-2">
              Seleccionar Plan
            </Heading>
            <Text className="text-sm text-gray-600 mb-4">
              Elige el plan de membresía para este contrato
            </Text>
          </View>

          {!sortedPlans.length ? (
            <View className="p-8">
              <Text className="text-gray-500 text-center">No hay planes disponibles</Text>
            </View>
          ) : (
            <ActionsheetFlatList
              data={sortedPlans}
              keyExtractor={(item: any) => item.id}
              renderItem={renderPlanItem}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </ActionsheetContent>
      </Actionsheet>
    </>
  );
};