# Task: Refactor Check-In System

## Objetivo
Crear un componente especializado de check-in con tabs para mostrar clientes pendientes y los que ya hicieron check-in hoy, manteniendo el header fijo y usando timezone correcto.

## Flujo de Usuario Detallado

### Flujo Principal - Check-in Pendiente
1. **Usuario presiona botón de Check-in** en el dashboard
2. **Se abre el BottomSheet** con el componente `CheckInClientsList`
3. **Vista inicial**:
   - Header fijo con título "Check-In de Clientes" y fecha actual
   - Barra de búsqueda fija
   - Tabs con "Pendientes" (activo por defecto) y "Completados"
   - Lista de clientes que **pueden hacer check-in hoy** (activos, con membresía válida, sin check-in previo hoy)
4. **Usuario selecciona un cliente** de la lista de pendientes
5. **Navega a pantalla de registro** (`CheckInRegistrationScreen`)
6. **Usuario confirma el check-in**
7. **Después del check-in exitoso**:
   - Se invalidan TODAS las queries de clientes: `queryClient.invalidateQueries({ queryKey: ['clients'] })`
   - Se invalida la query del dashboard: `queryClient.invalidateQueries({ queryKey: ['dashboard'] })`
   - El cliente pasa automáticamente del tab "Pendientes" al tab "Completados"
   - Se actualizan los contadores en los badges

### Flujo Secundario - Vista Informativa
1. **Usuario selecciona tab "Completados"**
2. **Se muestra lista de clientes** que ya hicieron check-in hoy
3. **Lista es solo informativa** - no se puede seleccionar ningún cliente
4. **Permite ver** quién ya asistió al gimnasio en el día

### Validaciones Importantes
- **Tab "Pendientes"**: Solo muestra clientes que PUEDEN hacer check-in (activos + membresía válida + sin check-in hoy)
- **Tab "Completados"**: Muestra todos los que ya hicieron check-in hoy (informativo)
- **Timezone**: Respeta el horario del gimnasio para determinar "hoy"

## Problemas Identificados

### Problema 1: Listado de Clientes Incorrecto
**Situación Actual:**
- El listado de check-in muestra todos los clientes activos con membresía
- No diferencia entre clientes que ya hicieron check-in hoy y los que no
- No existe una vista con tabs para ver ambos grupos

**Impacto:**
- Experiencia de usuario confusa
- No hay visibilidad de quién ya hizo check-in
- Dificulta el control diario de asistencia

### Problema 2: Header No Fijo en Scroll
**Situación Actual:**
- Al hacer scroll en el listado, el header "Seleccionar Cliente" se pierde
- La búsqueda también se desplaza fuera de vista
- No hay tabs para cambiar entre vistas

**Impacto:**
- Navegación difícil en listas largas
- Pérdida de contexto al hacer scroll
- No se puede ver información de ambos grupos fácilmente

## Solución Propuesta

### Fase 1: Backend - Agregar Filtros de Check-In con Timezone

#### 1.1 Actualizar DTO de Búsqueda
**Archivo:** `packages/api/src/modules/clients/dto/search-clients.dto.ts`

Agregar dos nuevos parámetros opcionales:
```typescript
@ApiProperty({
  example: false,
  required: false,
  description: 'Filter clients who have NOT checked in today (timezone-aware)',
})
@IsOptional()
@IsBoolean()
@Transform(({ value }) => value === 'true' || value === true)
notCheckedInToday?: boolean;

@ApiProperty({
  example: false,
  required: false,
  description: 'Filter clients who HAVE checked in today (timezone-aware)',
})
@IsOptional()
@IsBoolean()
@Transform(({ value }) => value === 'true' || value === true)
checkedInToday?: boolean;
```

#### 1.2 Actualizar Servicio de Clientes con Timezone
**Archivo:** `packages/api/src/modules/clients/clients.service.ts`

En el método `searchClients`, agregar la lógica de filtrado con timezone correcto:

```typescript
import { TimezoneUtil } from 'src/common/utils/timezone.util';

// Check-in filtering for today with timezone support
if (dto.notCheckedInToday || dto.checkedInToday) {
  // Get gym's timezone from context
  const gymTimezone = context.organization.timezone || 'America/Lima';

  // Get today's start and end in the gym's timezone, converted to UTC
  const todayStart = TimezoneUtil.startOfDayUtc(new Date(), gymTimezone);
  const todayEnd = TimezoneUtil.endOfDayUtc(new Date(), gymTimezone);

  if (dto.notCheckedInToday) {
    where.checkIns = {
      none: {
        createdAt: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
    };
  } else if (dto.checkedInToday) {
    where.checkIns = {
      some: {
        createdAt: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
    };
  }
}

// Include today's check-in status in response when needed
if (dto.notCheckedInToday || dto.checkedInToday || dto.includeContractStatus) {
  const gymTimezone = context.organization.timezone || 'America/Lima';
  const todayStart = TimezoneUtil.startOfDayUtc(new Date(), gymTimezone);
  const todayEnd = TimezoneUtil.endOfDayUtc(new Date(), gymTimezone);

  includeOptions.checkIns = {
    where: {
      createdAt: {
        gte: todayStart,
        lt: todayEnd,
      },
    },
    take: 1,
    orderBy: { createdAt: 'desc' },
  };
}
```

#### 1.3 Actualizar Transformación de Cliente
En el mismo servicio, actualizar el método de transformación para incluir el estado de check-in:

```typescript
// Add after contract mapping
hasCheckedInToday: client.checkIns && client.checkIns.length > 0,
lastCheckIn: client.checkIns?.[0] ? {
  id: client.checkIns[0].id,
  timestamp: client.checkIns[0].timestamp,
  createdAt: client.checkIns[0].createdAt,
} : undefined,
```

### Fase 2: SDK - Actualizar Tipos y Parámetros

#### 2.1 Actualizar Tipos de Cliente
**Archivo:** `packages/sdk/src/models/clients.ts`

```typescript
export interface SearchClientsParams extends PaginationQueryDto {
  search?: string;
  activeOnly?: boolean;
  clientNumber?: string;
  documentId?: string;
  includeContractStatus?: boolean;
  notCheckedInToday?: boolean;  // Nuevo
  checkedInToday?: boolean;      // Nuevo
}

export interface Client {
  // ... campos existentes ...
  hasCheckedInToday?: boolean;
  lastCheckIn?: {
    id: string;
    timestamp: string;
    createdAt: string;
  };
}
```

### Fase 3: Mobile App - Crear Componente Especializado con Tabs

#### 3.1 Crear Nuevo Componente CheckInClientsList
**Archivo:** `packages/mobile/src/features/dashboard/components/CheckInClientsList.tsx`

Componente completamente nuevo y especializado exclusivamente para check-in con tabs:

```typescript
import React, { useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Pressable } from '@/components/ui/pressable';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Icon } from '@/components/ui/icon';
import { UsersIcon } from 'lucide-react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ClientCard } from '@/shared/components/ClientCard';
import { InputSearch } from '@/shared/input-search';
import { useDataSearch } from '@/hooks/useDataSearch';
import { useClientsController } from '@/features/clients/controllers/clients.controller';
import { useLoadingScreenStore } from '@/shared/loading-screen';
import type { Client } from '@gymspace/sdk';

interface CheckInClientsListProps {
  onClientSelect?: (client: Client) => void;
}

// Componente ClientListItem reutilizado (simplificado para check-in)
interface ClientListItemProps {
  client: Client;
  onPress: (client: Client) => void;
  canSelect?: boolean;
  selectReason?: string;
}

const ClientListItem: React.FC<ClientListItemProps> = ({
  client,
  onPress,
  canSelect = true,
  selectReason,
}) => {
  return (
    <ClientCard
      client={client}
      onPress={() => onPress(client)}
      disabled={!canSelect}
      showCheckInStatus={true}
      canCheckIn={canSelect}
      checkInReason={selectReason}
      variant="complete" // Siempre usar variant complete para check-in
    />
  );
};

export const CheckInClientsList: React.FC<CheckInClientsListProps> = ({
  onClientSelect,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const { useClientsList } = useClientsController();

  // Query para clientes pendientes de check-in
  const {
    data: pendingResponse,
    isLoading: pendingLoading,
    refetch: refetchPending,
    isRefetching: pendingRefetching,
  } = useClientsList({
    notCheckedInToday: true,
    activeOnly: true,
    includeContractStatus: true,
    limit: 100,
  });

  // Query para clientes que ya hicieron check-in
  const {
    data: completedResponse,
    isLoading: completedLoading,
    refetch: refetchCompleted,
    isRefetching: completedRefetching,
  } = useClientsList({
    checkedInToday: true,
    limit: 100,
  });

  const pendingClients = pendingResponse?.data || [];
  const completedClients = completedResponse?.data || [];

  // Clientes actuales según el tab activo
  const currentClients = activeTab === 'pending' ? pendingClients : completedClients;
  const isLoading = activeTab === 'pending' ? pendingLoading : completedLoading;
  const isRefetching = activeTab === 'pending' ? pendingRefetching : completedRefetching;
  const refetch = activeTab === 'pending' ? refetchPending : refetchCompleted;

  // Búsqueda local
  const { searchInput, setSearchInput, filteredData, clearSearch } = useDataSearch({
    data: currentClients,
    searchFields: (client) => [
      client.name || '',
      client.email || '',
      client.clientNumber || '',
      client.documentValue || '',
      client.phone || '',
    ],
    searchPlaceholder: 'Buscar cliente...',
  });

  const displayClients = searchInput.length > 0 ? filteredData : currentClients;

  // Validación de si el cliente puede hacer check-in
  const canClientCheckIn = (client: Client): { canSelect: boolean; reason?: string } => {
    // En tab completados, los items son solo informativos
    if (activeTab === 'completed') {
      return {
        canSelect: false,
        reason: 'Ya hizo check-in hoy',
      };
    }

    // En tab pendientes, todos los clientes mostrados YA PUEDEN hacer check-in
    // porque el filtro notCheckedInToday + activeOnly + includeContractStatus
    // ya garantiza que solo se muestran clientes válidos
    // Esta validación adicional es solo por seguridad
    if (client.status !== 'active') {
      return {
        canSelect: false,
        reason: 'Cliente inactivo',
      };
    }

    if (!client.contracts || client.contracts.length === 0) {
      return {
        canSelect: false,
        reason: 'Sin membresía activa',
      };
    }

    const now = new Date();
    const hasValidContract = client.contracts.some((contract) => {
      if (contract.status !== 'active') return false;
      const startDate = new Date(contract.startDate);
      const endDate = new Date(contract.endDate);
      return now >= startDate && now <= endDate;
    });

    if (!hasValidContract) {
      return {
        canSelect: false,
        reason: 'Membresía expirada',
      };
    }

    // Si llegó aquí, puede hacer check-in
    return { canSelect: true };
  };

  const handleClientPress = (client: Client) => {
    const checkInStatus = canClientCheckIn(client);

    if (!checkInStatus.canSelect && activeTab === 'pending') {
      // Mostrar error si el cliente no puede hacer check-in
      const { show, hide } = useLoadingScreenStore.getState();
      show('error', checkInStatus.reason || 'El cliente no puede hacer check-in', [
        {
          label: 'Entendido',
          onPress: () => hide(),
          variant: 'solid',
        },
      ]);
      return;
    }

    // Solo permitir selección en el tab de pendientes
    if (activeTab === 'pending' && onClientSelect) {
      onClientSelect(client);
    }
  };

  const renderEmptyState = () => (
    <VStack className="items-center justify-center py-8">
      <Icon as={UsersIcon} className="w-12 h-12 text-gray-300 mb-4" />
      <Text className="text-gray-500 text-center">
        {activeTab === 'pending'
          ? 'Todos los clientes ya hicieron check-in hoy ✅'
          : 'Ningún cliente ha hecho check-in todavía'}
      </Text>
    </VStack>
  );

  const renderClientItem = (client: Client) => {
    const filterResult = canClientCheckIn(client);
    return (
      <ClientListItem
        key={client.id}
        client={client}
        onPress={handleClientPress}
        canSelect={filterResult.canSelect}
        selectReason={filterResult.reason}
      />
    );
  };

  if (isLoading) {
    return (
      <VStack className="flex-1 items-center justify-center mt-6">
        <Spinner size="large" />
        <Text className="mt-2 text-gray-600">Cargando clientes...</Text>
      </VStack>
    );
  }

  // Contenido principal con tabs
  return (
    <View className="flex-1 bg-white">
      {/* Header Fijo con Tabs */}
      <VStack className="bg-white border-b border-gray-200" style={{ zIndex: 10 }}>
        {/* Título */}
        <VStack className="px-6 py-4">
          <Text className="text-xl font-bold text-gray-900">Check-In de Clientes</Text>
          <Text className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </VStack>

        {/* Tabs */}
        <HStack className="px-4">
          <Pressable
            className={`flex-1 py-3 border-b-2 ${
              activeTab === 'pending' ? 'border-blue-600' : 'border-transparent'
            }`}
            onPress={() => setActiveTab('pending')}
          >
            <HStack className="justify-center items-center gap-2">
              <Text
                className={`font-medium ${
                  activeTab === 'pending' ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                Pendientes
              </Text>
              {pendingClients.length > 0 && (
                <Badge variant="outline" size="sm">
                  <BadgeText>{pendingClients.length}</BadgeText>
                </Badge>
              )}
            </HStack>
          </Pressable>

          <Pressable
            className={`flex-1 py-3 border-b-2 ${
              activeTab === 'completed' ? 'border-green-600' : 'border-transparent'
            }`}
            onPress={() => setActiveTab('completed')}
          >
            <HStack className="justify-center items-center gap-2">
              <Text
                className={`font-medium ${
                  activeTab === 'completed' ? 'text-green-600' : 'text-gray-600'
                }`}
              >
                Completados
              </Text>
              {completedClients.length > 0 && (
                <Badge variant="success" size="sm">
                  <BadgeText>{completedClients.length}</BadgeText>
                </Badge>
              )}
            </HStack>
          </Pressable>
        </HStack>

        {/* Search Bar fija */}
        <VStack className="px-4 pb-3 pt-2 bg-white">
          <InputSearch
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Buscar cliente..."
            onClear={clearSearch}
            isSheet={true} // Siempre true ya que solo se usa en sheet
          />
        </VStack>
      </VStack>

      {/* Lista scrollable para Bottom Sheet */}
      <BottomSheetScrollView
        contentContainerClassName="flex-grow px-4 pt-2 pb-4"
        showsVerticalScrollIndicator={false}
      >
        {displayClients.length > 0 ? (
          displayClients.map((client) => renderClientItem(client))
        ) : (
          renderEmptyState()
        )}
      </BottomSheetScrollView>
    </View>
  );
};
```

#### 3.2 Actualizar ClientListScreen para usar el nuevo componente
**Archivo:** `packages/mobile/src/features/dashboard/components/ClientListScreen.tsx`

Simplificar para usar el nuevo componente especializado:

```typescript
import { useMultiScreenContext } from '@/components/ui/multi-screen';
import { CheckInClientsList } from './CheckInClientsList';
import type { Client } from '@gymspace/sdk';
import React from 'react';

export const ClientListScreen: React.FC = () => {
  const { router } = useMultiScreenContext();

  const handleSelectClient = (client: Client) => {
    try {
      // Navigate to registration screen with selected client
      router.navigate('registration', { props: { client } });
    } catch (error) {
      console.log('Error navigating to registration screen:', error);
    }
  };

  return <CheckInClientsList onClientSelect={handleSelectClient} />;
};
```

#### 3.3 Actualizar CheckInSheet
**Archivo:** `packages/mobile/src/features/dashboard/components/CheckInSheet.tsx`

Configurar correctamente el BottomSheet:

```typescript
import { createMultiScreen } from '@/components/ui/multi-screen/builder';
import { BottomSheetWrapper } from '@gymspace/sheet';
import React from 'react';
import { CheckInRegistrationScreen } from './CheckInRegistrationScreen';
import { ClientListScreen } from './ClientListScreen';

// Create the multi-screen flow
const checkInFlow = createMultiScreen()
  .addStep('client-list', ClientListScreen)
  .addStep('registration', CheckInRegistrationScreen)
  .build();

export const CheckInSheet: React.FC = () => {
  const { Component } = checkInFlow;

  return (
    <BottomSheetWrapper
      sheetId="check-in"
      snapPoints={['75%', '90%']} // Dos snap points para mejor UX
      enablePanDownToClose
      scrollable={false} // El scroll lo maneja el componente interno
    >
      <Component />
    </BottomSheetWrapper>
  );
};
```

#### 3.4 NO se modifica ClientsListGeneric
**Importante:** No se toca `ClientsListGeneric`. El nuevo componente `CheckInClientsList` es completamente independiente y maneja su propia lógica de renderizado y queries.

### Fase 4: Mejoras Adicionales

#### 4.1 Actualización en Tiempo Real
Después de hacer check-in exitosamente, invalidar TODAS las queries necesarias:

```typescript
// En CheckInRegistrationScreen después del check-in exitoso
await queryClient.invalidateQueries({
  queryKey: ['clients'] // Invalida todas las queries de clientes
});
await queryClient.invalidateQueries({
  queryKey: ['dashboard'] // Actualiza estadísticas del dashboard
});
```

#### 4.2 Indicador Visual en ClientCard
Agregar indicador de check-in en el componente ClientCard cuando `hasCheckedInToday` está disponible:

```typescript
{client.hasCheckedInToday && (
  <Badge variant="success" size="sm">
    <BadgeText>✓ Check-in hoy</BadgeText>
  </Badge>
)}
```

## Validación y Testing

### Tests Manuales Requeridos

#### Flujo Principal
1. ✅ Usuario presiona botón check-in → Se abre el BottomSheet
2. ✅ Tab "Pendientes" activo por defecto
3. ✅ Solo se muestran clientes que PUEDEN hacer check-in (activos + membresía válida + sin check-in hoy)
4. ✅ Header, tabs y búsqueda permanecen fijos al hacer scroll
5. ✅ Usuario puede buscar clientes en tiempo real
6. ✅ Al seleccionar cliente → Navega a CheckInRegistrationScreen
7. ✅ Después del check-in exitoso:
   - Cliente desaparece de "Pendientes"
   - Cliente aparece en "Completados"
   - Contadores de badges se actualizan
   - Dashboard se actualiza con nuevas estadísticas

#### Flujo Informativo
1. ✅ Usuario selecciona tab "Completados"
2. ✅ Se muestran clientes que ya hicieron check-in hoy
3. ✅ Los clientes NO son seleccionables (solo informativo)
4. ✅ La búsqueda funciona en ambos tabs

#### Validaciones Técnicas
1. ✅ El timezone del gimnasio se usa correctamente para determinar "hoy"
2. ✅ Las queries se invalidan correctamente tras el check-in
3. ✅ No hay duplicados entre tabs

### Tests de API
- Verificar endpoint con `notCheckedInToday=true` usando timezone correcto
- Verificar endpoint con `checkedInToday=true` usando timezone correcto
- Confirmar que ambos filtros son mutuamente excluyentes
- Validar que se usa el timezone de la organización

## Diferencias Clave de la Implementación

### 1. No crear nuevos controladores
- Usar el hook existente `useClientsList` con los nuevos parámetros
- No duplicar lógica, solo pasar diferentes filtros

### 2. Componente completamente nuevo y especializado
- Crear `CheckInClientsList.tsx` en `packages/mobile/src/features/dashboard/components/`
- NO TOCAR `ClientsListGeneric` - mantenerlo intacto
- Solo reutilizar `ClientListItem` como componente interno
- Dos tabs: "Pendientes" (seleccionable) y "Completados" (solo informativo)

### 3. Timezone en backend
- Usar `TimezoneUtil` para convertir correctamente las fechas
- Obtener timezone de `context.organization.timezone`
- Aplicar `startOfDayUtc` y `endOfDayUtc` para rangos precisos

### 4. Header fijo con tabs
- Header con título y fecha actual
- Tabs fijos debajo del header
- Search bar también fija
- Contadores en badges para cada tab
- Solo el contenido de la lista hace scroll

### 5. Manejo independiente y simplificado
- El nuevo componente es exclusivo para check-in (sin prop `isSheet`)
- Siempre usa `BottomSheetScrollView` ya que solo se usa en sheet
- Tiene su propia lógica de búsqueda local
- No depende de `ClientsListGeneric` en absoluto
- ClientListItem simplificado sin parámetros innecesarios

## Estimación de Tiempo

- **Backend (API + SDK):** 2 horas
  - Actualizar DTOs: 20 min
  - Modificar servicio con timezone: 40 min
  - Actualizar SDK: 20 min
  - Testing: 40 min

- **Mobile App:** 3 horas
  - Crear componente con tabs: 1.5 horas
  - Actualizar ClientListScreen: 30 min
  - Modificar ClientsListGeneric: 30 min
  - Testing y ajustes: 30 min

**Total estimado:** 5 horas

## Orden de Implementación

1. **Primero:** Backend - Agregar filtros con timezone correcto
2. **Segundo:** SDK - Actualizar tipos
3. **Tercero:** Mobile - Crear `CheckInClientsListTabs`
4. **Cuarto:** Mobile - Actualizar `ClientListScreen` y `ClientsListGeneric`
5. **Último:** Testing integral

## Ventajas de Este Enfoque

- **Sin duplicación:** Reutiliza el hook existente con diferentes parámetros
- **Mejor UX:** Tabs permiten ver ambos grupos fácilmente
- **Timezone correcto:** Respeta el horario del gimnasio
- **Header fijo:** Mejora navegación en listas largas
- **Retrocompatible:** No afecta otros lugares donde se usa el listado