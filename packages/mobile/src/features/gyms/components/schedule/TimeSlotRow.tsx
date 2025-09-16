import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { FormInput } from '@/components/forms/FormInput';
import { X } from 'lucide-react-native';
import { useScheduleContext, DayKey } from './ScheduleContext';

interface TimeSlotRowProps {
  dayKey: DayKey;
  index: number;
  onRemove: () => void;
}

export const TimeSlotRow: React.FC<TimeSlotRowProps> = ({
  dayKey,
  index,
  onRemove,
}) => {
  const { form } = useScheduleContext();
  const { formState: { errors } } = form;

  // Get error paths for this specific time slot
  const openError = errors[dayKey]?.slots?.[index]?.open;
  const closeError = errors[dayKey]?.slots?.[index]?.close;

  return (
    <View className="flex-row items-start space-x-3 mb-3">
      {/* Open Time Input */}
      <View className="flex-1">
        <FormInput
          name={`${dayKey}.slots.${index}.open`}
          label=""
          placeholder="06:00"
          maxLength={5}
          keyboardType="numeric"
        />
        {openError && (
          <Text className="text-xs text-red-500 mt-1">
            {openError.message}
          </Text>
        )}
      </View>

      {/* Separator */}
      <View className="justify-center pt-3">
        <Text className="text-gray-500 text-sm">a</Text>
      </View>

      {/* Close Time Input */}
      <View className="flex-1">
        <FormInput
          name={`${dayKey}.slots.${index}.close`}
          label=""
          placeholder="22:00"
          maxLength={5}
          keyboardType="numeric"
        />
        {closeError && (
          <Text className="text-xs text-red-500 mt-1">
            {closeError.message}
          </Text>
        )}
      </View>

      {/* Remove Button */}
      <View className="justify-center pt-3">
        <TouchableOpacity
          onPress={onRemove}
          className="p-2 -m-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
};