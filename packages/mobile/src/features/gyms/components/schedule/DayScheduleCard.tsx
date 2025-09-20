import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Switch } from '@/components/ui/switch';
import { Plus } from 'lucide-react-native';
import { useScheduleContext, DayKey } from './ScheduleContext';
import { TimeSlotRow } from './TimeSlotRow';

interface DayScheduleCardProps {
  dayKey: DayKey;
  label: string;
}

export const DayScheduleCard: React.FC<DayScheduleCardProps> = ({
  dayKey,
  label,
}) => {
  const {
    toggleDayOpen,
    addTimeSlot,
    removeTimeSlot,
    getDaySchedule,
  } = useScheduleContext();

  const daySchedule = getDaySchedule(dayKey);

  return (
    <View className="border border-gray-200 rounded-lg p-4 mb-4">
      {/* Day Header */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-base font-semibold text-gray-900">
          {label}
        </Text>
        <Switch
          isChecked={daySchedule.isOpen}
          onToggle={() => toggleDayOpen(dayKey)}
        />
      </View>

      {/* Time Slots */}
      {daySchedule.isOpen && (
        <View>
          {/* Existing Time Slots */}
          {daySchedule.slots.map((_, index) => (
            <TimeSlotRow
              key={`${dayKey}-${index}`}
              dayKey={dayKey}
              index={index}
              onRemove={() => removeTimeSlot(dayKey, index)}
            />
          ))}

          {/* Add Time Slot Button */}
          <TouchableOpacity
            onPress={() => addTimeSlot(dayKey)}
            className="flex-row items-center justify-center py-3 border border-dashed border-gray-300 rounded-lg mt-2"
          >
            <Plus size={16} color="#6b7280" />
            <Text className="text-sm text-gray-500 ml-2">
              Agregar horario
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Closed Day Message */}
      {!daySchedule.isOpen && (
        <View className="py-4">
          <Text className="text-sm text-gray-500 text-center">
            Closed
          </Text>
        </View>
      )}
    </View>
  );
};