import React, { createContext, useContext, ReactNode } from 'react';
import { useForm, FormProvider, useFieldArray, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Schemas
const timeSlotSchema = z.object({
  open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido (HH:MM)'),
  close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido (HH:MM)'),
});

const dayScheduleSchema = z.object({
  isOpen: z.boolean(),
  slots: z.array(timeSlotSchema),
});

export const scheduleSchema = z.object({
  monday: dayScheduleSchema,
  tuesday: dayScheduleSchema,
  wednesday: dayScheduleSchema,
  thursday: dayScheduleSchema,
  friday: dayScheduleSchema,
  saturday: dayScheduleSchema,
  sunday: dayScheduleSchema,
});

export type ScheduleFormData = z.infer<typeof scheduleSchema>;
export type DayKey = keyof ScheduleFormData;
export type TimeSlot = z.infer<typeof timeSlotSchema>;

// Context
interface ScheduleContextType {
  form: UseFormReturn<ScheduleFormData>;
  toggleDayOpen: (dayKey: DayKey) => void;
  addTimeSlot: (dayKey: DayKey) => void;
  removeTimeSlot: (dayKey: DayKey, index: number) => void;
  getDaySchedule: (dayKey: DayKey) => {
    isOpen: boolean;
    slots: TimeSlot[];
  };
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const useScheduleContext = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useScheduleContext must be used within a ScheduleProvider');
  }
  return context;
};

// Provider Props
interface ScheduleProviderProps {
  children: ReactNode;
  defaultValues?: Partial<ScheduleFormData>;
}

export const ScheduleProvider: React.FC<ScheduleProviderProps> = ({
  children,
  defaultValues
}) => {
  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      monday: { isOpen: false, slots: [] },
      tuesday: { isOpen: false, slots: [] },
      wednesday: { isOpen: false, slots: [] },
      thursday: { isOpen: false, slots: [] },
      friday: { isOpen: false, slots: [] },
      saturday: { isOpen: false, slots: [] },
      sunday: { isOpen: false, slots: [] },
      ...defaultValues,
    },
  });

  const { getValues, setValue } = form;

  const toggleDayOpen = (dayKey: DayKey) => {
    const currentDay = getValues(dayKey);
    const newIsOpen = !currentDay.isOpen;
    setValue(dayKey, {
      isOpen: newIsOpen,
      slots: newIsOpen ? [{ open: '06:00', close: '22:00' }] : [],
    }, { shouldValidate: true });
  };

  const addTimeSlot = (dayKey: DayKey) => {
    const currentDay = getValues(dayKey);
    setValue(dayKey, {
      ...currentDay,
      slots: [...currentDay.slots, { open: '06:00', close: '22:00' }],
    }, { shouldValidate: true });
  };

  const removeTimeSlot = (dayKey: DayKey, index: number) => {
    const currentDay = getValues(dayKey);
    setValue(dayKey, {
      ...currentDay,
      slots: currentDay.slots.filter((_, i) => i !== index),
    }, { shouldValidate: true });
  };

  const getDaySchedule = (dayKey: DayKey) => {
    return getValues(dayKey);
  };

  const contextValue: ScheduleContextType = {
    form,
    toggleDayOpen,
    addTimeSlot,
    removeTimeSlot,
    getDaySchedule: getDaySchedule as any,
  };

  return (
    <ScheduleContext.Provider value={contextValue}>
      <FormProvider {...form}>
        {children}
      </FormProvider>
    </ScheduleContext.Provider>
  );
};

// Day names configuration
export const dayNames = [
  { key: 'monday' as DayKey, label: 'Lunes' },
  { key: 'tuesday' as DayKey, label: 'Martes' },
  { key: 'wednesday' as DayKey, label: 'Miércoles' },
  { key: 'thursday' as DayKey, label: 'Jueves' },
  { key: 'friday' as DayKey, label: 'Viernes' },
  { key: 'saturday' as DayKey, label: 'Sábado' },
  { key: 'sunday' as DayKey, label: 'Domingo' },
];