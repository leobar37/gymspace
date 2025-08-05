import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { 
  MembershipPlan, 
  CreateMembershipPlanDto, 
  UpdateMembershipPlanDto,
  MembershipPlanStats,
  GetMembershipPlansParams 
} from '@gymspace/sdk';

// Query keys
export const plansKeys = {
  all: ['plans'] as const,
  lists: () => [...plansKeys.all, 'list'] as const,
  list: (filters: any) => [...plansKeys.lists(), { filters }] as const,
  details: () => [...plansKeys.all, 'detail'] as const,
  detail: (id: string) => [...plansKeys.details(), id] as const,
  stats: (id: string) => [...plansKeys.detail(id), 'stats'] as const,
};

// Types
export interface PlanFormData {
  name: string;
  description?: string;
  basePrice: number;
  durationMonths?: number;
  durationDays?: number;
  features?: string[];
  termsAndConditions?: string;
  allowsCustomPricing?: boolean;
  maxEvaluations?: number;
  includesAdvisor?: boolean;
  showInCatalog?: boolean;
  status?: 'active' | 'inactive' | 'archived';
}

export interface SearchFilters {
  activeOnly?: boolean;
}

export const usePlansController = () => {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  // Get plans list
  const usePlansList = (filters: SearchFilters = {}) => {
    return useQuery({
      queryKey: plansKeys.list(filters),
      queryFn: async () => {
        const params: GetMembershipPlansParams = {
          activeOnly: filters.activeOnly,
        };
        const response = await sdk.membershipPlans.getGymMembershipPlans(params);
        return response;
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };

  // Get plan details
  const usePlanDetail = (planId: string) => {
    return useQuery({
      queryKey: plansKeys.detail(planId),
      queryFn: async () => {
        const response = await sdk.membershipPlans.getMembershipPlan(planId);
        return response;
      },
      enabled: !!planId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Get plan stats
  const usePlanStats = (planId: string) => {
    return useQuery({
      queryKey: plansKeys.stats(planId),
      queryFn: async () => {
        const response = await sdk.membershipPlans.getMembershipPlanStats(planId);
        return response;
      },
      enabled: !!planId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Create plan mutation
  const createPlanMutation = useMutation({
    mutationFn: async (data: PlanFormData) => {
      // Transform PlanFormData to CreateMembershipPlanDto
      const createData: CreateMembershipPlanDto = {
        name: data.name,
        description: data.description,
        basePrice: data.basePrice,
        durationMonths: data.durationMonths,
        durationDays: data.durationDays,
        features: data.features || [],
        termsAndConditions: data.termsAndConditions,
        allowsCustomPricing: data.allowsCustomPricing || false,
        maxEvaluations: data.maxEvaluations || 0,
        includesAdvisor: data.includesAdvisor || false,
        showInCatalog: data.showInCatalog || false,
      };
      const response = await sdk.membershipPlans.createMembershipPlan(createData);
      return response;
    },
    onSuccess: () => {
      // Invalidate plans list to refetch
      queryClient.invalidateQueries({ queryKey: plansKeys.lists() });
    },
  });

  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PlanFormData> }) => {
      // Transform PlanFormData to UpdateMembershipPlanDto
      const updateData: UpdateMembershipPlanDto = {
        name: data.name,
        description: data.description,
        basePrice: data.basePrice,
        durationMonths: data.durationMonths,
        durationDays: data.durationDays,
        features: data.features,
        termsAndConditions: data.termsAndConditions,
        allowsCustomPricing: data.allowsCustomPricing,
        maxEvaluations: data.maxEvaluations,
        includesAdvisor: data.includesAdvisor,
        showInCatalog: data.showInCatalog,
        status: data.status,
      };
      const response = await sdk.membershipPlans.updateMembershipPlan(id, updateData);
      return response;
    },
    onSuccess: (data, variables) => {
      // Update cache for this plan
      queryClient.setQueryData(plansKeys.detail(variables.id), data);
      // Invalidate list to show updated data
      queryClient.invalidateQueries({ queryKey: plansKeys.lists() });
    },
  });

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      await sdk.membershipPlans.deleteMembershipPlan(planId);
    },
    onSuccess: (_, planId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: plansKeys.detail(planId) });
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: plansKeys.lists() });
    },
  });

  // Prefetch plan data
  const prefetchPlan = async (planId: string) => {
    await queryClient.prefetchQuery({
      queryKey: plansKeys.detail(planId),
      queryFn: async () => {
        const response = await sdk.membershipPlans.getMembershipPlan(planId);
        return response;
      },
    });
  };

  return {
    // Query hooks
    usePlansList,
    usePlanDetail,
    usePlanStats,
    
    // Mutations
    createPlan: createPlanMutation.mutate,
    isCreatingPlan: createPlanMutation.isPending,
    createPlanError: createPlanMutation.error,
    
    updatePlan: updatePlanMutation.mutate,
    isUpdatingPlan: updatePlanMutation.isPending,
    
    deletePlan: deletePlanMutation.mutate,
    isDeletingPlan: deletePlanMutation.isPending,
    
    // Utilities
    prefetchPlan,
    invalidatePlans: () => queryClient.invalidateQueries({ queryKey: plansKeys.all }),
  };
};