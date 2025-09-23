import { AnimatedTouchableOpacity } from '@/components/ui/animated-touchable-opacity';
import { cn } from '@/lib/utils';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { Calendar, CalendarClock, CalendarDays, CalendarRange, X } from 'lucide-react-native';
import React, { useEffect, useReducer, useRef } from 'react';
import { Platform, Text, View } from 'react-native';
import BottomSheetModal, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Portal } from '@gorhom/portal';
import { renderBackdrop } from "@gymspace/sheet";
type TimeRangeOption = 'day' | 'week' | 'month' | 'custom';

interface TimeRangeProps {
  onRangeChange?: (startDate: Date, endDate: Date) => void;
  className?: string;
  hideLabel?: boolean;
  labelText?: string;
  descriptionText?: string;
}

interface TimeRangeState {
  selectedOption: TimeRangeOption;
  customStartDate: Date;
  customEndDate: Date;
  showStartPicker: boolean;
  showEndPicker: boolean;
  currentStartDate: Date;
  currentEndDate: Date;
}

type TimeRangeAction =
  | { type: 'SELECT_OPTION'; payload: TimeRangeOption }
  | { type: 'SET_CUSTOM_START_DATE'; payload: Date }
  | { type: 'SET_CUSTOM_END_DATE'; payload: Date }
  | { type: 'SHOW_START_PICKER'; payload: boolean }
  | { type: 'SHOW_END_PICKER'; payload: boolean }
  | { type: 'UPDATE_DATE_RANGE'; payload: { start: Date; end: Date } };

const calculateDateRange = (
  option: TimeRangeOption,
  customStart?: Date,
  customEnd?: Date,
): { start: Date; end: Date } => {
  const now = dayjs();

  switch (option) {
    case 'day':
      return {
        start: now.startOf('day').toDate(),
        end: now.endOf('day').toDate(),
      };
    case 'week':
      return {
        start: now.subtract(7, 'day').startOf('day').toDate(),
        end: now.endOf('day').toDate(),
      };
    case 'month':
      return {
        start: now.subtract(30, 'day').startOf('day').toDate(),
        end: now.endOf('day').toDate(),
      };
    case 'custom':
      return {
        start: customStart || now.startOf('day').toDate(),
        end: customEnd || now.endOf('day').toDate(),
      };
    default:
      return {
        start: now.startOf('day').toDate(),
        end: now.endOf('day').toDate(),
      };
  }
};

const initialState: TimeRangeState = {
  selectedOption: 'day',
  customStartDate: dayjs().toDate(),
  customEndDate: dayjs().toDate(),
  showStartPicker: false,
  showEndPicker: false,
  currentStartDate: dayjs().startOf('day').toDate(),
  currentEndDate: dayjs().endOf('day').toDate(),
};

function timeRangeReducer(state: TimeRangeState, action: TimeRangeAction): TimeRangeState {
  switch (action.type) {
    case 'SELECT_OPTION': {
      const range = calculateDateRange(action.payload, state.customStartDate, state.customEndDate);
      return {
        ...state,
        selectedOption: action.payload,
        currentStartDate: range.start,
        currentEndDate: range.end,
        showStartPicker: false,
        showEndPicker: false,
      };
    }
    case 'SET_CUSTOM_START_DATE':
      return {
        ...state,
        customStartDate: action.payload,
        currentStartDate:
          state.selectedOption === 'custom' ? action.payload : state.currentStartDate,
      };
    case 'SET_CUSTOM_END_DATE':
      return {
        ...state,
        customEndDate: action.payload,
        currentEndDate: state.selectedOption === 'custom' ? action.payload : state.currentEndDate,
      };
    case 'SHOW_START_PICKER':
      return {
        ...state,
        showStartPicker: action.payload,
        showEndPicker: false,
      };
    case 'SHOW_END_PICKER':
      return {
        ...state,
        showEndPicker: action.payload,
        showStartPicker: false,
      };
    case 'UPDATE_DATE_RANGE':
      return {
        ...state,
        currentStartDate: action.payload.start,
        currentEndDate: action.payload.end,
      };
    default:
      return state;
  }
}

export function TimeRange({
  onRangeChange,
  className,
  hideLabel = false,
  labelText = 'Período de tiempo',
  descriptionText = 'Selecciona el rango de fechas para ver las estadísticas',
}: TimeRangeProps) {
  const [state, dispatch] = useReducer(timeRangeReducer, initialState);
  const customRangeSheetRef = useRef<BottomSheetModal>(null);

  const options: { value: TimeRangeOption; label: string; icon: React.ReactNode }[] = [
    {
      value: 'day',
      label: 'Día',
      icon: <Calendar size={16} color={state.selectedOption === 'day' ? '#3b82f6' : '#6b7280'} />,
    },
    {
      value: 'week',
      label: 'Semana',
      icon: (
        <CalendarDays size={16} color={state.selectedOption === 'week' ? '#3b82f6' : '#6b7280'} />
      ),
    },
    {
      value: 'month',
      label: 'Mes',
      icon: (
        <CalendarRange size={16} color={state.selectedOption === 'month' ? '#3b82f6' : '#6b7280'} />
      ),
    },
    {
      value: 'custom',
      label: 'Per..',
      icon: (
        <CalendarClock
          size={16}
          color={state.selectedOption === 'custom' ? '#3b82f6' : '#6b7280'}
        />
      ),
    },
  ];

  // Initialize with day range
  useEffect(() => {
    const range = calculateDateRange('day');
    dispatch({ type: 'UPDATE_DATE_RANGE', payload: range });
    onRangeChange?.(range.start, range.end);
  }, []);

  // Notify parent when date range changes
  useEffect(() => {
    if (state.selectedOption === 'custom' && (state.customStartDate || state.customEndDate)) {
      onRangeChange?.(state.currentStartDate, state.currentEndDate);
    }
  }, [state.currentStartDate, state.currentEndDate, state.selectedOption]);

  const handleOptionSelect = (option: TimeRangeOption) => {
    if (option === 'custom') {
      console.log('custom option selected', customRangeSheetRef.current);
      customRangeSheetRef.current?.expand?.();
    } else {
      dispatch({ type: 'SELECT_OPTION', payload: option });
      const range = calculateDateRange(option);
      onRangeChange?.(range.start, range.end);
    }
  };

  const handleCustomDateChange = (
    _event: any,
    selectedDate: Date | undefined,
    isStart: boolean,
  ) => {
    if (Platform.OS === 'android') {
      dispatch({ type: 'SHOW_START_PICKER', payload: false });
      dispatch({ type: 'SHOW_END_PICKER', payload: false });
    }

    if (selectedDate) {
      if (isStart) {
        dispatch({ type: 'SET_CUSTOM_START_DATE', payload: selectedDate });
      } else {
        dispatch({ type: 'SET_CUSTOM_END_DATE', payload: selectedDate });
      }
    }
  };

  const applyCustomRange = () => {
    dispatch({ type: 'SELECT_OPTION', payload: 'custom' });
    onRangeChange?.(state.customStartDate, state.customEndDate);
    customRangeSheetRef.current?.close();
  };

  const formatDate = (date: Date) => {
    return dayjs(date).format('DD/MM/YYYY');
  };

  const getDaysDifference = () => {
    return dayjs(state.customEndDate).diff(dayjs(state.customStartDate), 'day') + 1;
  };

  return (
    <>
      <View className={cn('', className)}>
        {/* Header - Conditionally rendered */}
        {!hideLabel && (
          <View className="mb-3">
            <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              {labelText}
            </Text>
            <Text className="text-xs text-gray-400 dark:text-gray-500">{descriptionText}</Text>
          </View>
        )}

        {/* Segmented Control with improved design */}
        <View className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-1">
          <View className="flex-row">
            {options.map((option, index) => (
              <AnimatedTouchableOpacity
                key={option.value}
                onPress={() => handleOptionSelect(option.value)}
                className={cn(
                  'flex-1 py-2.5 px-2 rounded-lg transition-all',
                  state.selectedOption === option.value
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    : 'bg-transparent',
                )}
                style={{
                  marginRight: index < options.length - 1 ? 2 : 0,
                }}
              >
                <View className="items-center">
                  {option.icon}
                  <Text
                    className={cn(
                      'text-xs font-semibold mt-1',
                      state.selectedOption === option.value
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400',
                    )}
                  >
                    {option.label}
                  </Text>
                </View>
              </AnimatedTouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Custom Date Range Sheet */}
      <Portal>
        <BottomSheetModal backdropComponent={renderBackdrop()} enablePanDownToClose ref={customRangeSheetRef} snapPoints={['40%']}>
          <BottomSheetView className="p-4">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">Rango personalizado</Text>
              <AnimatedTouchableOpacity
                onPress={() => customRangeSheetRef.current.close()}
                className="p-2"
              >
                <X size={24} color="#6b7280" />
              </AnimatedTouchableOpacity>
            </View>

            {/* Date Pickers */}
            <View className="space-y-4">
              {/* Start Date */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Fecha inicial</Text>
                <AnimatedTouchableOpacity
                  onPress={() => dispatch({ type: 'SHOW_START_PICKER', payload: true })}
                  className="bg-gray-50 rounded-lg p-4 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center">
                    <Calendar size={20} color="#3b82f6" />
                    <Text className="text-base font-medium text-gray-900 ml-3">
                      {formatDate(state.customStartDate)}
                    </Text>
                  </View>
                  <Text className="text-sm text-blue-600">Cambiar</Text>
                </AnimatedTouchableOpacity>
              </View>

              {/* End Date */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Fecha final</Text>
                <AnimatedTouchableOpacity
                  onPress={() => dispatch({ type: 'SHOW_END_PICKER', payload: true })}
                  className="bg-gray-50 rounded-lg p-4 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center">
                    <Calendar size={20} color="#3b82f6" />
                    <Text className="text-base font-medium text-gray-900 ml-3">
                      {formatDate(state.customEndDate)}
                    </Text>
                  </View>
                  <Text className="text-sm text-blue-600">Cambiar</Text>
                </AnimatedTouchableOpacity>
              </View>

              {/* Summary */}
              <View className="bg-blue-50 rounded-lg p-3">
                <Text className="text-sm text-blue-900 text-center">
                  {(() => {
                    const days = getDaysDifference();
                    return `${days} ${days === 1 ? 'día' : 'días'} seleccionados`;
                  })()}
                </Text>
              </View>

              {/* Apply Button */}
              <AnimatedTouchableOpacity
                onPress={applyCustomRange}
                className="bg-blue-600 rounded-lg py-3 mt-2"
              >
                <Text className="text-white text-center font-semibold">Aplicar rango</Text>
              </AnimatedTouchableOpacity>
            </View>

            {/* Native Date Pickers */}
            {state.showStartPicker && (
              <DateTimePicker
                value={state.customStartDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => handleCustomDateChange(event, date, true)}
                maximumDate={state.customEndDate}
              />
            )}

            {state.showEndPicker && (
              <DateTimePicker
                value={state.customEndDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => handleCustomDateChange(event, date, false)}
                minimumDate={state.customStartDate}
                maximumDate={new Date()}
              />
            )}
          </BottomSheetView>
        </BottomSheetModal>
      </Portal>
    </>
  );
}
