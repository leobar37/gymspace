import { Card } from '@/components/ui/card';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useFormatPrice } from '@/config/ConfigContext';
import { router } from 'expo-router';
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  HistoryIcon,
  PackageIcon,
  ShoppingCartIcon,
  TagIcon,
  TrendingUpIcon,
  WrenchIcon,
} from 'lucide-react-native';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InventoryScreen() {
  const formatPrice = useFormatPrice();
  const handleNewSale = () => {
    router.push('/inventory/new-sale');
  };

  const handleViewProducts = () => {
    router.push('/inventory/products');
  };

  const handleSalesHistory = () => {
    router.push('/inventory/sales-history');
  };

  const handleReports = () => {
    router.push('/inventory/reports');
  };

  const handleLowStock = () => {
    router.push('/inventory/low-stock');
  };

  const handleCategories = () => {
    router.push('/inventory/categories');
  };

  const handleServices = () => {
    router.push('/inventory/services');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack space="md" className="p-4">
          {/* New Sale Button - Prominent */}
          <Card className="bg-blue-500 border-blue-600 shadow-lg">
            <Pressable onPress={handleNewSale} className="p-6 items-center justify-center">
              <VStack space="sm" className="items-center">
                <Icon as={ShoppingCartIcon} className="w-12 h-12 text-white" />
                <Text className="text-white text-xl font-bold text-center">Nueva Venta</Text>
                <Text className="text-blue-100 text-sm text-center">Iniciar proceso de venta</Text>
              </VStack>
            </Pressable>
          </Card>
          
          {/* Main Actions Grid */}
          <VStack space="sm">
            <Text className="text-gray-800 text-lg font-semibold">Gestión de Inventario</Text>

            <VStack space="sm">
              <Card>
                <Pressable
                  onPress={handleViewProducts}
                  className="p-4 flex-row items-center justify-between"
                >
                  <HStack space="md" className="items-center flex-1">
                    <Icon as={PackageIcon} className="w-6 h-6 text-blue-600" />
                    <VStack className="flex-1">
                      <Text className="text-gray-800 font-medium">Ver Productos</Text>
                      <Text className="text-gray-500 text-sm">
                        Gestionar inventario de productos
                      </Text>
                    </VStack>
                  </HStack>
                  <Icon as={ChevronRightIcon} className="w-5 h-5 text-gray-400" />
                </Pressable>
              </Card>

              <Card>
                <Pressable
                  onPress={handleServices}
                  className="p-4 flex-row items-center justify-between"
                >
                  <HStack space="md" className="items-center flex-1">
                    <Icon as={WrenchIcon} className="w-6 h-6 text-purple-600" />
                    <VStack className="flex-1">
                      <Text className="text-gray-800 font-medium">Ver Servicios</Text>
                      <Text className="text-gray-500 text-sm">
                        Gestionar servicios del gimnasio
                      </Text>
                    </VStack>
                  </HStack>
                  <Icon as={ChevronRightIcon} className="w-5 h-5 text-gray-400" />
                </Pressable>
              </Card>

              <Card>
                <Pressable
                  onPress={handleCategories}
                  className="p-4 flex-row items-center justify-between"
                >
                  <HStack space="md" className="items-center flex-1">
                    <Icon as={TagIcon} className="w-6 h-6 text-indigo-600" />
                    <VStack className="flex-1">
                      <Text className="text-gray-800 font-medium">Ver Categorías</Text>
                      <Text className="text-gray-500 text-sm">
                        Gestionar categorías de productos
                      </Text>
                    </VStack>
                  </HStack>
                  <Icon as={ChevronRightIcon} className="w-5 h-5 text-gray-400" />
                </Pressable>
              </Card>

              <Card>
                <Pressable
                  onPress={handleSalesHistory}
                  className="p-4 flex-row items-center justify-between"
                >
                  <HStack space="md" className="items-center flex-1">
                    <Icon as={HistoryIcon} className="w-6 h-6 text-green-600" />
                    <VStack className="flex-1">
                      <Text className="text-gray-800 font-medium">Historial de Ventas</Text>
                      <Text className="text-gray-500 text-sm">Ver todas las ventas realizadas</Text>
                    </VStack>
                  </HStack>
                  <Icon as={ChevronRightIcon} className="w-5 h-5 text-gray-400" />
                </Pressable>
              </Card>

              <Card>
                <Pressable
                  onPress={handleLowStock}
                  className="p-4 flex-row items-center justify-between"
                >
                  <HStack space="md" className="items-center flex-1">
                    <Icon as={AlertTriangleIcon} className="w-6 h-6 text-orange-600" />
                    <VStack className="flex-1">
                      <Text className="text-gray-800 font-medium">Productos con Stock Bajo</Text>
                      <Text className="text-gray-500 text-sm">
                        Productos que necesitan reposición
                      </Text>
                    </VStack>
                  </HStack>
                  <Icon as={ChevronRightIcon} className="w-5 h-5 text-gray-400" />
                </Pressable>
              </Card>

              <Card>
                <Pressable
                  onPress={handleReports}
                  className="p-4 flex-row items-center justify-between"
                >
                  <HStack space="md" className="items-center flex-1">
                    <Icon as={TrendingUpIcon} className="w-6 h-6 text-purple-600" />
                    <VStack className="flex-1">
                      <Text className="text-gray-800 font-medium">Reportes y Análisis</Text>
                      <Text className="text-gray-500 text-sm">
                        Estadísticas de ventas y productos
                      </Text>
                    </VStack>
                  </HStack>
                  <Icon as={ChevronRightIcon} className="w-5 h-5 text-gray-400" />
                </Pressable>
              </Card>
            </VStack>
          </VStack>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
