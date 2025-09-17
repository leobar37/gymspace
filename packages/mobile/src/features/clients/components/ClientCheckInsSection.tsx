import React, { useState } from 'react';
import { View, ScrollView, Pressable, RefreshControl } from 'react-native';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Divider } from '@/components/ui/divider';
import { 
  CheckCircleIcon, 
  CalendarIcon, 
  ClockIcon,
  FileTextIcon 
} from 'lucide-react-native';
import { useCheckInsController } from '@/features/dashboard/controllers/check-ins.controller';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

interface ClientCheckInsSectionProps {
  clientId: string;
  isCollapsed?: boolean;
}

interface CheckInItemProps {
  checkIn: {
    id: string;
    timestamp: string;  // Changed from checkInTime to timestamp
    checkOutTime?: string;
    notes?: string | null;
  };
}

// Set dayjs locale to Spanish
dayjs.locale('es');

const CheckInItem: React.FC<CheckInItemProps> = ({ checkIn }) => {
  console.log("check in", JSON.stringify(checkIn, null, 2));
  
  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('D MMM YYYY');
  };

  const formatTime = (dateString: string) => {
    return dayjs(dateString).format('HH:mm');
  };

  const getDuration = (checkIn: string, checkOut?: string) => {
    if (!checkOut) return 'En progreso';
    
    const start = dayjs(checkIn);
    const end = dayjs(checkOut);
    const diffInMinutes = end.diff(start, 'minute');
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} minutos`;
  };

  return (
    <Card className="p-4 bg-white">
      <VStack className="gap-3">
        <HStack className="items-center justify-between">
          <HStack className="items-center gap-2">
            <Icon as={CalendarIcon} className="w-4 h-4 text-gray-500" />
            <Text className="font-medium text-gray-900">
              {formatDate(checkIn.timestamp)}
            </Text>
          </HStack>
          <Badge 
            variant="solid" 
            action={checkIn.checkOutTime ? 'muted' : 'success'}
          >
            <BadgeText>
              {checkIn.checkOutTime ? 'Completado' : 'Activo'}
            </BadgeText>
          </Badge>
        </HStack>

        <HStack className="items-start gap-6">
          <VStack className="gap-1">
            <HStack className="items-center gap-2">
              <Icon as={CheckCircleIcon} className="w-4 h-4 text-green-600" />
              <Text className="text-sm text-gray-600">Entrada</Text>
            </HStack>
            <Text className="text-sm font-medium text-gray-900 ml-6">
              {formatTime(checkIn.timestamp)}
            </Text>
          </VStack>

          {checkIn.checkOutTime && (
            <VStack className="gap-1">
              <HStack className="items-center gap-2">
                <Icon as={ClockIcon} className="w-4 h-4 text-red-600" />
                <Text className="text-sm text-gray-600">Salida</Text>
              </HStack>
              <Text className="text-sm font-medium text-gray-900 ml-6">
                {formatTime(checkIn.checkOutTime)}
              </Text>
            </VStack>
          )}

          <VStack className="gap-1">
            <Text className="text-sm text-gray-600">Duración</Text>
            <Text className="text-sm font-medium text-gray-900">
              {getDuration(checkIn.timestamp, checkIn.checkOutTime)}
            </Text>
          </VStack>
        </HStack>

        {checkIn.notes && (
          <HStack className="items-start gap-2 pt-2 border-t border-gray-100">
            <Icon as={FileTextIcon} className="w-4 h-4 text-gray-500 mt-0.5" />
            <Text className="text-sm text-gray-600 flex-1">
              {checkIn.notes}
            </Text>
          </HStack>
        )}
      </VStack>
    </Card>
  );
};

export const ClientCheckInsSection: React.FC<ClientCheckInsSectionProps> = ({ 
  clientId,
  isCollapsed = false 
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const { useClientCheckInHistory, invalidateCheckIns } = useCheckInsController();
  
  const { 
    data: checkInsHistory, 
    isLoading, 
    refetch 
  } = useClientCheckInHistory(clientId, !isCollapsed);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isCollapsed) {
    return null;
  }

  if (isLoading) {
    return (
      <VStack className="items-center justify-center py-8">
        <Spinner className="text-blue-600" />
        <Text className="text-gray-600 mt-2">Cargando check-ins...</Text>
      </VStack>
    );
  }

  const checkIns = checkInsHistory?.checkIns || [];
  const totalCheckIns = checkInsHistory?.metrics.totalCheckIns || 0;
  const thisMonthCount = checkInsHistory?.metrics.last30Days || 0;
  const lastCheckIn = checkInsHistory?.metrics.lastCheckIn;

  return (
    <VStack className="gap-4">
      {/* Stats Summary */}
      <Card className="p-4 bg-blue-50 border border-blue-200">
        <VStack className="gap-3">
          <Text className="font-semibold text-gray-900">
            Resumen de Asistencias
          </Text>
          <HStack className="justify-around">
            <VStack className="items-center">
              <Text className="text-2xl font-bold text-blue-600">
                {totalCheckIns}
              </Text>
              <Text className="text-xs text-gray-600">Total</Text>
            </VStack>
            <Divider orientation="vertical" className="h-12" />
            <VStack className="items-center">
              <Text className="text-2xl font-bold text-blue-600">
                {thisMonthCount}
              </Text>
              <Text className="text-xs text-gray-600">Este Mes</Text>
            </VStack>
            {lastCheckIn && (
              <>
                <Divider orientation="vertical" className="h-12" />
                <VStack className="items-center">
                  <Text className="text-sm font-medium text-gray-900">
                    {dayjs(lastCheckIn).format('D MMM')}
                  </Text>
                  <Text className="text-xs text-gray-600">Última Visita</Text>
                </VStack>
              </>
            )}
          </HStack>
        </VStack>
      </Card>

      {/* Check-ins List */}
      {checkIns.length > 0 ? (
        <VStack className="gap-3">
          <HStack className="items-center justify-between">
            <Text className="font-semibold text-gray-900">
              Historial de Check-ins
            </Text>
            <Text className="text-sm text-gray-500">
              Últimos {checkIns.length} registros
            </Text>
          </HStack>
          
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          >
            <VStack className="gap-3">
              {checkIns.map((checkIn: any) => (
                <CheckInItem key={checkIn.id} checkIn={checkIn} />
              ))}
            </VStack>
          </ScrollView>
        </VStack>
      ) : (
        <Card className="p-8 bg-gray-50">
          <VStack className="items-center gap-2">
            <Icon as={CheckCircleIcon} className="w-12 h-12 text-gray-300" />
            <Text className="text-gray-600 text-center">
              No hay check-ins registrados
            </Text>
            <Text className="text-sm text-gray-500 text-center">
              Los check-ins aparecerán aquí cuando el cliente visite el gimnasio
            </Text>
          </VStack>
        </Card>
      )}
    </VStack>
  );
};