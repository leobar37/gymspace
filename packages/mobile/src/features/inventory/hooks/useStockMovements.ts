import { useQuery } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';

export const useProductStockMovements = (productId: string) => {
  const { sdk } = useGymSdk();

  return useQuery({
    queryKey: ['stock-movements', productId],
    queryFn: () => sdk.products.getProductStockMovements(productId),
    enabled: !!productId,
  });
};