import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { useLocalSearchParams, router } from 'expo-router';
import { UpdateGymScheduleDto } from '@gymspace/sdk';
import { useLoadingScreen } from '@/shared/loading-screen';
import { Spinner } from '@/components/ui/spinner';
import { useGym, useUpdateGymSchedule } from '@/features/gyms/controllers/gyms.controller';
import { ScheduleForm, ScheduleFormData } from '@/features/gyms/components/schedule';

export default function EditGymScheduleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { execute } = useLoadingScreen();
  const { data: gym, isLoading } = useGym(id);
  const updateGymScheduleMutation = useUpdateGymSchedule();

  const handleSubmit = async (data: ScheduleFormData) => {
    const updatePromise = async () => {
      const updateData: UpdateGymScheduleDto = data as UpdateGymScheduleDto;
      await updateGymScheduleMutation.mutateAsync({ id, data: updateData });
      router.back();
    };

    await execute(updatePromise(), {
      action: 'Actualizando horario del gimnasio...',
      successMessage: 'Horario actualizado exitosamente',
      errorFormatter: (error: any) => error.message || 'Error al actualizar el horario',
    });
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Spinner size="large" />
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

  // Prepare default values from existing gym schedule
  const defaultValues = gym.schedule ? {
    monday: gym.schedule.monday || { isOpen: false, slots: [] },
    tuesday: gym.schedule.tuesday || { isOpen: false, slots: [] },
    wednesday: gym.schedule.wednesday || { isOpen: false, slots: [] },
    thursday: gym.schedule.thursday || { isOpen: false, slots: [] },
    friday: gym.schedule.friday || { isOpen: false, slots: [] },
    saturday: gym.schedule.saturday || { isOpen: false, slots: [] },
    sunday: gym.schedule.sunday || { isOpen: false, slots: [] },
  } : undefined;

  return (
    <ScheduleForm
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}