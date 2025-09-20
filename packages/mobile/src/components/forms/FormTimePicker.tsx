import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, Modal, Platform } from 'react-native';
import { useController, useFormContext } from 'react-hook-form';
import type { UseControllerProps, FieldValues } from 'react-hook-form';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Clock, X } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';

interface FormTimePickerProps<TFieldValues extends FieldValues = FieldValues>
  extends Omit<UseControllerProps<TFieldValues>, 'control'> {
  label?: string;
  placeholder?: string;
  control?: UseControllerProps<TFieldValues>['control'];
}

// Helper to convert 24h time string to Date using dayjs
const timeStringToDate = (timeString: string): Date => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return dayjs().hour(hours).minute(minutes).second(0).millisecond(0).toDate();
};

// Helper to convert Date to 24h time string (for storage) using dayjs
const dateToTimeString = (date: Date): string => {
  return dayjs(date).format('HH:mm');
};

// Helper to format time in 12h format with AM/PM for display using dayjs
const formatTime12Hour = (timeString: string): string => {
  if (!timeString || !timeString.includes(':')) return '';
  
  const [hours, minutes] = timeString.split(':').map(Number);
  // Create a temporary date with the specified time
  const tempDate = dayjs().hour(hours).minute(minutes);
  
  return tempDate.format('h:mm A');
};

export const FormTimePicker = <TFieldValues extends FieldValues = FieldValues>({
  name,
  control,
  rules,
  defaultValue,
  shouldUnregister,
  label,
  placeholder = 'Select time',
}: FormTimePickerProps<TFieldValues>) => {
  const formContext = useFormContext<TFieldValues>();
  const { field, fieldState } = useController({
    name,
    control: control || formContext.control,
    rules,
    defaultValue,
    shouldUnregister,
  });

  const [showPicker, setShowPicker] = useState(false);
  const [tempTime, setTempTime] = useState<Date>(() => {
    return field.value ? timeStringToDate(field.value) : new Date();
  });

  const handleTimeChange = useCallback((event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'set' && selectedDate) {
        const timeString = dateToTimeString(selectedDate);
        field.onChange(timeString);
      }
    } else if (selectedDate) {
      // iOS - update temp time for modal
      setTempTime(selectedDate);
    }
  }, [field]);

  const handleConfirm = useCallback(() => {
    const timeString = dateToTimeString(tempTime);
    field.onChange(timeString);
    setShowPicker(false);
  }, [tempTime, field]);

  const handleCancel = useCallback(() => {
    setShowPicker(false);
    // Reset temp time to current field value
    if (field.value) {
      setTempTime(timeStringToDate(field.value));
    }
  }, [field.value]);

  const displayValue = field.value ? formatTime12Hour(field.value) : '';

  return (
    <View>
      {label && (
        <Text className="text-sm font-medium text-gray-900 mb-1.5">{label}</Text>
      )}
      
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        className="flex-row items-center justify-between bg-white border border-gray-300 rounded-xl px-4 py-3"
      >
        <Text className={displayValue ? 'text-gray-900' : 'text-gray-400'}>
          {displayValue || placeholder}
        </Text>
        <Clock size={20} color="#9ca3af" />
      </TouchableOpacity>

      {fieldState.error && (
        <Text className="text-xs text-red-500 mt-1">
          {fieldState.error.message}
        </Text>
      )}

      {/* Android Time Picker */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={field.value ? timeStringToDate(field.value) : new Date()}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleTimeChange}
        />
      )}

      {/* iOS Time Picker Modal */}
      {Platform.OS === 'ios' && showPicker && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showPicker}
          onRequestClose={handleCancel}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={handleCancel}
          >
            <View className="flex-1 justify-end bg-black/30">
              <TouchableOpacity
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                <View className="bg-white rounded-t-3xl">
                  {/* Modal Header */}
                  <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={handleCancel}
                    >
                      <ButtonText>Cancel</ButtonText>
                    </Button>
                    
                    <Text className="text-base font-semibold text-gray-900">
                      Select Time
                    </Text>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={handleConfirm}
                    >
                      <ButtonText className="text-blue-600">Done</ButtonText>
                    </Button>
                  </View>

                  {/* Time Picker */}
                  <View className="p-4">
                    <DateTimePicker
                      value={tempTime}
                      mode="time"
                      is24Hour={false}
                      display="spinner"
                      onChange={handleTimeChange}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};