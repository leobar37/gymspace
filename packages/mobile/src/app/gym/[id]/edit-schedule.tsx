import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { AnimatedAnimatedTouchableOpacity } from '@/components/ui/animated-touchable-opacity';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useLocalSearchParams, router } from 'expo-router';
import { UpdateGymScheduleDto, DaySchedule } from '@gymspace/sdk';
import { useLoadingScreen } from '@/shared/loading-screen';
import { toast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react-native';
import { useGym, useUpdateGymSchedule } from '@/features/gyms/controllers/gyms.controller';

const dayNames = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

interface ScheduleData {
  [key: string]: DaySchedule;
}

export default function EditGymScheduleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { execute } = useLoadingScreen();
  const { data: gym, isLoading } = useGym(id);
  const updateGymScheduleMutation = useUpdateGymSchedule();
  const [schedule, setSchedule] = useState<ScheduleData>({});

  useEffect(() => {
    if (gym) {
      // Initialize schedule with existing data or defaults
      const initialSchedule: ScheduleData = {};
      dayNames.forEach(({ key }) => {
        const existing = gym.schedule?.[key as keyof typeof gym.schedule];
        initialSchedule[key] = existing || {
          isOpen: false,
          slots: [],
        };
      });
      setSchedule(initialSchedule);
    }
  }, [gym]);

  const toggleDayOpen = (dayKey: string) => {
    setSchedule(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        isOpen: !prev[dayKey].isOpen,
        slots: !prev[dayKey].isOpen ? [{ open: '06:00', close: '22:00' }] : [],
      },
    }));
  };

  const addTimeSlot = (dayKey: string) => {
    setSchedule(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        slots: [...(prev[dayKey].slots || []), { open: '06:00', close: '22:00' }],
      },
    }));
  };

  const removeTimeSlot = (dayKey: string, index: number) => {
    setSchedule(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        slots: prev[dayKey].slots?.filter((_, i) => i !== index) || [],
      },
    }));
  };

  const updateTimeSlot = (dayKey: string, index: number, field: 'open' | 'close', value: string) => {
    setSchedule(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        slots: prev[dayKey].slots?.map((slot, i) => 
          i === index ? { ...slot, [field]: value } : slot
        ) || [],
      },
    }));
  };

  const validateTime = (time: string): boolean => {
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  };

  const onSubmit = async () => {
    // Validate all time slots
    for (const [dayKey, daySchedule] of Object.entries(schedule)) {
      if (daySchedule.isOpen && daySchedule.slots) {
        for (const slot of daySchedule.slots) {
          if (!validateTime(slot.open) || !validateTime(slot.close)) {
            toast.error('Por favor, ingrese horarios válidos en formato HH:MM');
            return;
          }
        }
      }
    }

    await execute({
      action: 'Actualizando horario del gimnasio...',
      successMessage: 'Horario actualizado exitosamente',
      errorFormatter: (error) => error.message || 'Error al actualizar el horario',
      func: async () => {
        const updateData: UpdateGymScheduleDto = schedule as UpdateGymScheduleDto;
        await updateGymScheduleMutation.mutateAsync({ id, data: updateData });
        router.back();
      },
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Spinner size="lg" />
      </View>
    );
  }

  if (!gym) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-center">No se encontró el gimnasio</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4 space-y-4">
        <Text className="text-sm text-gray-600 mb-2">
          Configure los horarios de apertura y cierre para cada día de la semana.
          Puede agregar múltiples rangos horarios por día.
        </Text>

        {dayNames.map(({ key, label }) => {
          const daySchedule = schedule[key];
          
          return (
            <View key={key} className="border border-gray-200 rounded-lg p-4">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-base font-medium">{label}</Text>
                <Switch
                  checked={daySchedule?.isOpen || false}
                  onCheckedChange={() => toggleDayOpen(key)}
                />
              </View>

              {daySchedule?.isOpen && (
                <View className="space-y-2">
                  {daySchedule.slots?.map((slot, index) => (
                    <View key={index} className="flex-row items-center space-x-2">
                      <Input
                        value={slot.open}
                        onChangeText={(value) => updateTimeSlot(key, index, 'open', value)}
                        placeholder="06:00"
                        className="flex-1"
                        maxLength={5}
                      />
                      <Text className="text-gray-500">a</Text>
                      <Input
                        value={slot.close}
                        onChangeText={(value) => updateTimeSlot(key, index, 'close', value)}
                        placeholder="22:00"
                        className="flex-1"
                        maxLength={5}
                      />
                      <AnimatedTouchableOpacity
                        onPress={() => removeTimeSlot(key, index)}
                        className="p-2"
                      >
                        <X size={20} className="text-red-500" />
                      </AnimatedTouchableOpacity>
                    </View>
                  ))}

                  <AnimatedTouchableOpacity
                    onPress={() => addTimeSlot(key)}
                    className="flex-row items-center justify-center py-2 border border-dashed border-gray-300 rounded"
                  >
                    <Plus size={16} className="text-gray-500 mr-1" />
                    <Text className="text-sm text-gray-500">Agregar horario</Text>
                  </AnimatedTouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        <View className="flex-row space-x-3 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onPress={() => router.back()}
          >
            <Text>Cancelar</Text>
          </Button>
          <Button
            variant="solid"
            className="flex-1"
            onPress={onSubmit}
          >
            <Text>Guardar Horario</Text>
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}