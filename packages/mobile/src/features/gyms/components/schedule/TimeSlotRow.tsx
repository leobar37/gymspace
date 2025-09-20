import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { FormTimePicker } from '@/components/forms';
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
    <View className="flex-row items-start gap-2 mb-3">
      {/* Open Time Input */}
      <View className="flex-1">
        <FormTimePicker
          name={`${dayKey}.slots.${index}.open`}
          placeholder="Open"
        />
      </View>

      {/* Close Time Input */}
      <View className="flex-1">
        <FormTimePicker
          name={`${dayKey}.slots.${index}.close`}
          placeholder="Close"
        />
      </View>

      {/* Remove Button */}
      <TouchableOpacity
        onPress={onRemove}
        className="mt-2.5 p-2"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <X size={20} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );
};