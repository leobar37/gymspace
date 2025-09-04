import React from 'react';
import { FlatList, Pressable, RefreshControl } from 'react-native';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { StockMovement } from '@gymspace/sdk';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface StockMovementsProps {
  stockMovements: StockMovement[];
  isLoading: boolean;
  onRefresh?: () => void;
  onItemPress: (movement: StockMovement) => void;
}

const getMovementTypeLabel = (type: string) => {
  const types = {
    manual_entry: 'Entrada manual',
    sale: 'Venta',
    return: 'Devolución',
    adjustment: 'Ajuste',
    initial_stock: 'Stock inicial'
  };
  return types[type as keyof typeof types] || type;
};

const getMovementTypeColor = (type: string) => {
  const colors = {
    manual_entry: 'text-blue-600',
    sale: 'text-red-600',
    return: 'text-green-600',
    adjustment: 'text-orange-600',
    initial_stock: 'text-gray-600'
  };
  return colors[type as keyof typeof colors] || 'text-gray-600';
};

const StockMovementItem = ({ movement, onPress }: { movement: StockMovement; onPress: (movement: StockMovement) => void }) => {
  return (
    <Pressable
      onPress={() => onPress(movement)}
      className="p-4 border-b border-gray-100"
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className={`text-sm font-medium ${getMovementTypeColor(movement.type)}`}>
              {getMovementTypeLabel(movement.type)}
            </Text>
            <Text className={`text-sm font-bold ${movement.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {movement.quantity >= 0 ? '+' : ''}{movement.quantity}
            </Text>
          </View>
          
          {movement.supplier && (
            <Text className="text-sm text-gray-600 mb-1">
              Proveedor: {movement.supplier.name}
            </Text>
          )}
          
          {movement.notes && (
            <Text className="text-sm text-gray-500 mb-2" numberOfLines={2}>
              {movement.notes}
            </Text>
          )}
          
          <Text className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(movement.createdAt), { 
              addSuffix: true, 
              locale: es 
            })}
          </Text>
        </View>
        
        <View className="items-end">
          <Text className="text-xs text-gray-400 mb-1">Stock</Text>
          <Text className="text-sm font-medium">
            {movement.previousStock} → {movement.newStock}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export const StockMovements = ({ stockMovements, isLoading, onRefresh, onItemPress }: StockMovementsProps) => {
  if (stockMovements.length === 0 && !isLoading) {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <Text className="text-gray-500 text-center">
          No hay movimientos de stock registrados
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={stockMovements}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <StockMovementItem movement={item} onPress={onItemPress} />
      )}
      refreshControl={
        onRefresh && (
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        )
      }
      contentContainerStyle={stockMovements.length === 0 ? { flex: 1 } : undefined}
    />
  );
};