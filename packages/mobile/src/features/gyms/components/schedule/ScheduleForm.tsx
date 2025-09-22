import React from 'react';
import { View } from 'react-native';
import { Button, ButtonText } from '@/components/ui/button';
import { VStack } from '@/components/ui/vstack';
import { ScreenForm } from '@/shared/components/ScreenForm';
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

  // Footer content with action buttons
  const footerContent = (
    <VStack space="sm">
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
    </VStack>
  );

  return (
    <ScreenForm
      showFixedFooter={true}
      useSafeArea={false}
      footerContent={footerContent}
      showBackButton={false}
      contentClassName="bg-gray-50"
    >
      {/* Day Schedule Cards */}
      <View className="rounded-xl py-3">
        {dayNames.map(({ key, label }) => (
          <DayScheduleCard
            key={key}
            dayKey={key}
            label={label}
          />
        ))}
      </View>
    </ScreenForm>
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