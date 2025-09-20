import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { PaySaleDto, Sale } from '@gymspace/sdk';

export function useSalesController() {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  const paySaleMutation = useMutation<
    Sale,
    Error,
    { id: string; data: PaySaleDto }
  >({
    mutationFn: async ({ id, data }) => {
      return await sdk.sales.paySale(id, data);
    },
    onSuccess: (updatedSale) => {
      // Invalidate queries to refresh sale data
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sale', updatedSale.id] });
    },
  });

  return {
    paySale: paySaleMutation.mutate,
    paySaleAsync: paySaleMutation.mutateAsync,
    isPayingSale: paySaleMutation.isPending,
  };
}