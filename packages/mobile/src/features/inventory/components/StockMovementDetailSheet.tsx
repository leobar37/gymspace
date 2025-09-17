import React from 'react';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { StockMovement } from '@gymspace/sdk';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { BottomSheetWrapper, SheetManager, SheetProps } from '@gymspace/sheet';

interface StockMovementDetailSheetProps extends SheetProps {
  movement?: StockMovement;
}

const getMovementTypeLabel = (type: string) => {
  const types = {
    manual_entry: 'Entrada manual',
    sale: 'Venta',
    return: 'Devolución',
    adjustment: 'Ajuste',
    initial_stock: 'Stock inicial',
  };
  return types[type as keyof typeof types] || type;
};

const getMovementTypeColor = (type: string) => {
  const colors = {
    manual_entry: 'text-blue-600',
    sale: 'text-red-600',
    return: 'text-green-600',
    adjustment: 'text-orange-600',
    initial_stock: 'text-gray-600',
  };
  return colors[type as keyof typeof colors] || 'text-gray-600';
};

const DetailRow = ({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) => (
  <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
    <Text className="text-gray-600 text-base">{label}</Text>
    <Text className={`text-base font-medium ${valueColor || 'text-gray-900'}`}>{value}</Text>
  </View>
);

export const StockMovementDetailSheet = (props: StockMovementDetailSheetProps) => {
  const movement = props.movement;
  if (!movement) return null;

  const quantityColor = movement.quantity >= 0 ? 'text-green-600' : 'text-red-600';
  const quantitySign = movement.quantity >= 0 ? '+' : '';

  return (
    <BottomSheetWrapper sheetId="stock-movement-detail" snapPoints={['60%']}>
      <View className="p-4 pb-8">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-semibold">Detalle del Movimiento</Text>
          <Button variant="ghost" size="sm" onPress={() => SheetManager.hide('stock-movement-detail')}>
            <ButtonText>Cerrar</ButtonText>
          </Button>
        </View>
        <DetailRow
          label="Tipo de movimiento"
          value={getMovementTypeLabel(movement.type)}
          valueColor={getMovementTypeColor(movement.type)}
        />

        <DetailRow
          label="Cantidad"
          value={`${quantitySign}${movement.quantity}`}
          valueColor={quantityColor}
        />

        <DetailRow label="Stock anterior" value={movement.previousStock?.toString() || 'N/A'} />

        <DetailRow label="Stock nuevo" value={movement.newStock?.toString() || 'N/A'} />

        {movement.supplier && <DetailRow label="Proveedor" value={movement.supplier.name} />}

        {movement.createdBy && <DetailRow label="Creado por" value={movement.createdBy.name} />}

        <DetailRow
          label="Fecha"
          value={format(new Date(movement.createdAt), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", {
            locale: es,
          })}
        />

        {movement.notes && (
          <View className="py-3">
            <Text className="text-gray-600 text-base mb-2">Notas</Text>
            <View className="bg-gray-50 p-3 rounded-lg">
              <Text className="text-gray-900 text-base leading-relaxed">{movement.notes}</Text>
            </View>
          </View>
        )}
      </View>
    </BottomSheetWrapper>
  );
};
