import React from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { ScheduleProvider, dayNames, ScheduleFormData, useScheduleContext } from './ScheduleContext';
import { DayScheduleCard } from './DayScheduleCard';

interface ScheduleFormContentProps {
  onSubmit: (data: ScheduleFormData) => void;
  onCancel: () => void;
}

const ScheduleFormContent: React.FC<ScheduleFormContentProps> = ({
  onSubmit,
  onCancel,
}) => {
  const { form } = useScheduleContext();
  const { handleSubmit } = form;

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View>
        {/* Instructions */}
        <View className="bg-white rounded-xl p-6 mb-6 shadow-sm">
          <Text className="text-sm text-gray-600 mb-4">
            Configure los horarios de apertura y cierre para cada día de la semana.
            Puede agregar múltiples rangos horarios por día.
          </Text>

          {/* Day Schedule Cards */}
          <View>
            {dayNames.map(({ key, label }) => (
              <DayScheduleCard
                key={key}
                dayKey={key}
                label={label}
              />
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View className="space-y-3">
          <Button
            variant="solid"
            size="lg"
            onPress={handleSubmit(onSubmit)}
          >
            <ButtonText>Guardar Horario</ButtonText>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onPress={onCancel}
          >
            <ButtonText>Cancelar</ButtonText>
          </Button>
        </View>
      </View>
    </ScrollView>
  );
};

interface ScheduleFormProps {
  defaultValues?: Partial<ScheduleFormData>;
  onSubmit: (data: ScheduleFormData) => void;
  onCancel: () => void;
}

export const ScheduleForm: React.FC<ScheduleFormProps> = ({
  defaultValues,
  onSubmit,
  onCancel,
}) => {
  return (
    <ScheduleProvider defaultValues={defaultValues}>
      <ScheduleFormContent
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </ScheduleProvider>
  );
};