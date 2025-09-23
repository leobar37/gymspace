'use client';
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCwIcon,
  PlusIcon,
  SearchIcon,
  CreditCardIcon,
  EditIcon,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { SubscriptionPlanDto } from '@gymspace/sdk';
import { formatDateTime } from '@/lib/utils';
import { useSubscriptionPlans } from './hooks/useSubscriptionPlans';
import { useDeleteSubscriptionPlan } from './hooks/useDeleteSubscriptionPlan';
import { SubscriptionPlanTable } from './components/SubscriptionPlanTable';
import { SubscriptionPlanForm } from './SubscriptionPlanForm';
import { PricingDisplay } from './components/PricingDisplay';
import { PlanFeaturesList } from './components/PlanFeaturesList';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function SubscriptionPlansList() {
  const { data: plans = [], isLoading, error, refetch } = useSubscriptionPlans();
  const deleteMutation = useDeleteSubscriptionPlan();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc';
  }>({
    key: null,
    direction: 'asc',
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanDto | null>(null);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [viewPlan, setViewPlan] = useState<SubscriptionPlanDto | null>(null);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return plans;

    const sorted = [...plans].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'pricing':
          aValue = a.price.PEN?.value || 0;
          bValue = b.price.PEN?.value || 0;
          break;
        case 'activeSubscriptions':
          aValue = a.activeSubscriptions || 0;
          bValue = b.activeSubscriptions || 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          aValue = (a as any)[sortConfig.key!];
          bValue = (b as any)[sortConfig.key!];
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [plans, sortConfig]);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return sortedData;

    const searchLower = searchTerm.toLowerCase();
    return sortedData.filter(
      (plan) =>
        plan.name.toLowerCase().includes(searchLower) ||
        plan.description?.toLowerCase().includes(searchLower) ||
        (plan.billingFrequency && plan.billingFrequency.toLowerCase().includes(searchLower))
    );
  }, [sortedData, searchTerm]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleCreatePlan = () => {
    setSelectedPlan(null);
    setIsFormOpen(true);
  };

  const handleEditPlan = (plan: SubscriptionPlanDto) => {
    setSelectedPlan(plan);
    setIsFormOpen(true);
  };

  const handleViewPlan = (plan: SubscriptionPlanDto) => {
    setViewPlan(plan);
  };

  const handleDeletePlan = (planId: string) => {
    setPlanToDelete(planId);
  };

  const confirmDelete = async () => {
    if (planToDelete) {
      await deleteMutation.mutateAsync(planToDelete);
      setPlanToDelete(null);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorState
            error={error as Error}
            icon={CreditCardIcon}
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage subscription plans and pricing for your platform
              </p>
            </div>
            <Button onClick={handleCreatePlan}>
              <PlusIcon className="size-4 mr-2" />
              Create Plan
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search plans by name, description, or frequency..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isLoading}
                >
                  <RefreshCwIcon
                    className={`size-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </Button>
              </div>

              {isLoading ? (
                <TableSkeleton rows={5} columns={7} />
              ) : filteredData.length === 0 ? (
                <EmptyState
                  icon={CreditCardIcon}
                  title="No subscription plans found"
                  description={
                    searchTerm
                      ? `No plans match "${searchTerm}". Try adjusting your search.`
                      : 'Get started by creating your first subscription plan.'
                  }
                  action={
                    !searchTerm && (
                      <Button onClick={handleCreatePlan}>
                        <PlusIcon className="size-4 mr-2" />
                        Create Your First Plan
                      </Button>
                    )
                  }
                />
              ) : (
                <SubscriptionPlanTable
                  plans={filteredData}
                  onView={handleViewPlan}
                  onEdit={handleEditPlan}
                  onDelete={handleDeletePlan}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <SubscriptionPlanForm
        plan={selectedPlan}
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => {
          setSelectedPlan(null);
          refetch();
        }}
      />

      <AlertDialog open={!!planToDelete} onOpenChange={() => setPlanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subscription Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this subscription plan? This action cannot be
              undone. Existing subscriptions will not be affected, but new subscriptions
              cannot be created with this plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {viewPlan && (
        <Dialog open={!!viewPlan} onOpenChange={() => setViewPlan(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Plan Details: {viewPlan.name}</DialogTitle>
              <DialogDescription>
                View complete details of this subscription plan
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {viewPlan.description || 'No description provided'}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <Badge variant={viewPlan.isActive ? 'default' : 'secondary'} className="mt-1">
                  {viewPlan.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Pricing</h3>
                <PricingDisplay
                  pricing={viewPlan.price}
                  billingFrequency={viewPlan.billingFrequency}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Max Gyms</h3>
                  <p className="mt-1 text-2xl font-semibold">{viewPlan.maxGyms}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Max Clients/Gym</h3>
                  <p className="mt-1 text-2xl font-semibold">{viewPlan.maxClientsPerGym}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Max Users/Gym</h3>
                  <p className="mt-1 text-2xl font-semibold">{viewPlan.maxUsersPerGym}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Features</h3>
                <PlanFeaturesList features={viewPlan.features} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDateTime(viewPlan.createdAt)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDateTime(viewPlan.updatedAt)}
                  </p>
                </div>
              </div>

              {viewPlan.activeSubscriptions !== undefined && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Active Subscriptions</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {viewPlan.activeSubscriptions} organizations currently using this plan
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewPlan(null)}>
                Close
              </Button>
              <Button onClick={() => {
                setViewPlan(null);
                handleEditPlan(viewPlan);
              }}>
                <EditIcon className="size-4 mr-2" />
                Edit Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}