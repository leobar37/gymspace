'use client';
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontalIcon,
  BuildingIcon,
  UserIcon,
  CalendarIcon,
  Building2Icon,
  MailIcon,
  EditIcon,
  EyeIcon,
  TrashIcon,
  RefreshCwIcon,
  TrendingUpIcon,
  BanIcon,
  CreditCardIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ClockIcon,
} from 'lucide-react';
import { GenericTable, Column, SortConfig } from '@/components/ui/generic-table';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils';
import { 
  OrganizationWithEnhancedDetails,
  OrganizationSubscriptionDetailsDto,
  SubscriptionPlan,
} from '@gymspace/sdk';

// Import modal components
import { UpgradeSubscriptionModal } from './components/UpgradeSubscriptionModal';
import { CancelSubscriptionModal } from './components/CancelSubscriptionModal';
import { RenewSubscriptionModal } from './components/RenewSubscriptionModal';

type ModalType = 'upgrade' | 'cancel' | 'renew' | null;

export function ListOrganizationsEnhanced() {
  const { sdk } = useGymSdk();
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: 'asc',
  });
  
  // Modal states
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<OrganizationSubscriptionDetailsDto | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);

  // Fetch enhanced organizations with subscription data
  const { data: organizations = [], isLoading, error, refetch } = useQuery({
    queryKey: ['organizations-enhanced'],
    queryFn: async () => {
      try {
        // @ts-ignore - SDK types might not be fully aligned
        const result = await sdk.organizations.listOrganizationsEnhanced();
        return result as OrganizationWithEnhancedDetails[];
      } catch (err: any) {
        if (err.response?.status === 403) {
          throw new Error('403: Forbidden - SUPER_ADMIN permission required');
        } else if (err.response?.status === 401) {
          throw new Error('401: Unauthorized - Please login');
        } else if (err.message === 'Network Error') {
          throw new Error('Network Error - Please check your connection');
        }
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch subscription plans
  const { data: plans = [] } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      try {
        // @ts-ignore - SDK types might not be fully aligned
        const result = await sdk.adminSubscriptions.listPlans();
        return result as SubscriptionPlan[];
      } catch (err) {
        console.error('Failed to fetch plans:', err);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000,
  });

  // Fetch organization details for modals
  const fetchOrganizationDetails = async (orgId: string) => {
    try {
      // @ts-ignore - SDK types might not be fully aligned
      const details = await sdk.organizations.getOrganizationSubscriptionDetails(orgId);
      setSelectedOrganization(details);
      setAvailablePlans(plans);
    } catch (error) {
      console.error('Failed to fetch organization details:', error);
    }
  };

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return organizations;

    const sorted = [...organizations].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch(sortConfig.key) {
        case 'owner':
          aValue = a.owner.fullName;
          bValue = b.owner.fullName;
          break;
        case 'gyms':
          aValue = a.gyms.length;
          bValue = b.gyms.length;
          break;
        case 'subscription':
          aValue = a.subscription?.planName || '';
          bValue = b.subscription?.planName || '';
          break;
        case 'status':
          aValue = a.subscription?.status || '';
          bValue = b.subscription?.status || '';
          break;
        case 'expiry':
          aValue = a.subscription?.endDate || '';
          bValue = b.subscription?.endDate || '';
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
  }, [organizations, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Handle modal actions
  const handleUpgrade = async (org: OrganizationWithEnhancedDetails) => {
    await fetchOrganizationDetails(org.id);
    setActiveModal('upgrade');
  };

  const handleCancel = async (org: OrganizationWithEnhancedDetails) => {
    await fetchOrganizationDetails(org.id);
    setActiveModal('cancel');
  };

  const handleRenew = async (org: OrganizationWithEnhancedDetails) => {
    await fetchOrganizationDetails(org.id);
    setActiveModal('renew');
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedOrganization(null);
    refetch(); // Refresh data after modal action
  };

  // Get subscription status badge
  const getSubscriptionStatusBadge = (org: OrganizationWithEnhancedDetails) => {
    if (!org.subscription) {
      return <Badge variant="outline">No Subscription</Badge>;
    }

    const { status, isExpiring, isExpired, daysUntilExpiration } = org.subscription;

    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    if (isExpiring) {
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          Expiring ({daysUntilExpiration}d)
        </Badge>
      );
    }

    if (status === 'active') {
      return <Badge variant="default">Active</Badge>;
    }

    if (status === 'cancelled') {
      return <Badge variant="secondary">Cancelled</Badge>;
    }

    return <Badge variant="outline">{status}</Badge>;
  };

  // Get usage indicator
  const getUsageIndicator = (current: number, limit: number) => {
    const percentage = limit > 0 ? (current / limit) * 100 : 0;
    const variant = percentage >= 90 ? 'destructive' : percentage >= 75 ? 'warning' : 'default';
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-24">
              <Progress value={percentage} className="h-2" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{current} / {limit} ({percentage.toFixed(0)}%)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Table columns definition
  const columns: Column<OrganizationWithEnhancedDetails>[] = [
    {
      key: 'name',
      header: 'Organization',
      sortable: true,
      accessor: (org) => (
        <div className="flex items-center gap-2">
          <BuildingIcon className="size-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{org.name}</div>
            {org.locale && (
              <div className="text-xs text-muted-foreground">
                {org.locale.country} • {org.locale.currency}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      sortable: true,
      accessor: (org) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <UserIcon className="size-3 text-muted-foreground" />
            <span className="text-sm">{org.owner.fullName}</span>
          </div>
          <div className="flex items-center gap-2">
            <MailIcon className="size-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {org.owner.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'subscription',
      header: 'Subscription',
      sortable: true,
      accessor: (org) => (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {org.subscription?.planName || 'No Plan'}
            </span>
            {getSubscriptionStatusBadge(org)}
          </div>
          {org.subscription && (
            <div className="text-xs text-muted-foreground">
              Expires: {formatDate(org.subscription.endDate)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'usage',
      header: 'Usage',
      accessor: (org) => (
        org.usage ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-16">Gyms:</span>
              {getUsageIndicator(org.usage.gyms.current, org.usage.gyms.limit)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-16">Clients:</span>
              {getUsageIndicator(org.usage.clients.current, org.usage.clients.limit)}
            </div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">No data</span>
        )
      ),
    },
    {
      key: 'gyms',
      header: 'Gyms',
      sortable: true,
      accessor: (org) => (
        org.gyms.length === 0 ? (
          <span className="text-sm text-muted-foreground">
            No gyms
          </span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {org.gyms.slice(0, 2).map((gym) => (
              <span
                key={gym.id}
                className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium"
                title={gym.address}
              >
                {gym.name}
              </span>
            ))}
            {org.gyms.length > 2 && (
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                +{org.gyms.length - 2} more
              </span>
            )}
          </div>
        )
      ),
    },
  ];

  const renderActions = (org: OrganizationWithEnhancedDetails) => {
    const hasSubscription = !!org.subscription;
    const isExpired = org.subscription?.isExpired;
    const isExpiring = org.subscription?.isExpiring;
    const canRenew = isExpired || isExpiring || (org.subscription?.daysUntilExpiration ?? 0) <= 30;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem>
            <EyeIcon className="size-4 mr-2" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem>
            <EditIcon className="size-4 mr-2" />
            Edit Organization
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Subscription Management
          </DropdownMenuLabel>
          
          {hasSubscription && !isExpired && (
            <>
              <DropdownMenuItem onClick={() => handleUpgrade(org)}>
                <TrendingUpIcon className="size-4 mr-2" />
                Upgrade Plan
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleCancel(org)}
                className="text-destructive focus:text-destructive"
              >
                <BanIcon className="size-4 mr-2" />
                Cancel Subscription
              </DropdownMenuItem>
            </>
          )}
          
          {canRenew && (
            <DropdownMenuItem 
              onClick={() => handleRenew(org)}
              className="text-green-600 focus:text-green-600"
            >
              <RefreshCwIcon className="size-4 mr-2" />
              Renew Subscription
              {isExpiring && (
                <Badge variant="outline" className="ml-auto text-xs">
                  {org.subscription?.daysUntilExpiration}d
                </Badge>
              )}
            </DropdownMenuItem>
          )}
          
          {!hasSubscription && (
            <DropdownMenuItem onClick={() => handleRenew(org)}>
              <CreditCardIcon className="size-4 mr-2" />
              Subscribe Now
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem className="text-destructive focus:text-destructive">
            <TrashIcon className="size-4 mr-2" />
            Delete Organization
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Subscription alerts/warnings
  const renderSubscriptionAlerts = () => {
    const expiringOrgs = organizations.filter(org => 
      org.subscription?.isExpiring && !org.subscription?.isExpired
    );
    const expiredOrgs = organizations.filter(org => org.subscription?.isExpired);
    const highUsageOrgs = organizations.filter(org => {
      if (!org.usage) return false;
      return org.usage.gyms.percentage >= 90 || 
             org.usage.clients.percentage >= 90 || 
             org.usage.collaborators.percentage >= 90;
    });

    if (!expiringOrgs.length && !expiredOrgs.length && !highUsageOrgs.length) {
      return null;
    }

    return (
      <div className="space-y-3 mb-6">
        {expiredOrgs.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircleIcon className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900">
                {expiredOrgs.length} Expired Subscription{expiredOrgs.length > 1 ? 's' : ''}
              </h4>
              <p className="text-sm text-red-700 mt-1">
                These organizations need immediate renewal to restore access.
              </p>
            </div>
          </div>
        )}
        
        {expiringOrgs.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangleIcon className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-orange-900">
                {expiringOrgs.length} Expiring Subscription{expiringOrgs.length > 1 ? 's' : ''}
              </h4>
              <p className="text-sm text-orange-700 mt-1">
                Subscriptions expiring within 30 days. Consider renewal to avoid service interruption.
              </p>
            </div>
          </div>
        )}
        
        {highUsageOrgs.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <ClockIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900">
                {highUsageOrgs.length} High Usage Warning{highUsageOrgs.length > 1 ? 's' : ''}
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                Organizations approaching plan limits. Consider upgrading for more capacity.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          {/* Header with title and refresh button */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold">Organizations</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage organization subscriptions and settings
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCwIcon className={`size-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Subscription Alerts */}
          {renderSubscriptionAlerts()}

          {/* Table */}
          <GenericTable
            data={sortedData}
            columns={columns}
            keyExtractor={(org) => org.id}
            sortConfig={sortConfig}
            onSort={handleSort}
            loading={isLoading}
            error={error as Error | null}
            emptyState={
              <EmptyState
                icon={Building2Icon}
                title="No organizations found"
                description="No organizations have been created yet."
                onRefresh={() => refetch()}
              />
            }
            errorState={
              <ErrorState
                error={error as Error}
                icon={Building2Icon}
                onRetry={() => refetch()}
              />
            }
            loadingState={<TableSkeleton rows={5} columns={6} />}
            actions={renderActions}
          />
        </div>
      </div>

      {/* Modals */}
      {selectedOrganization && (
        <>
          <UpgradeSubscriptionModal
            isOpen={activeModal === 'upgrade'}
            onClose={closeModal}
            organization={selectedOrganization}
            availablePlans={availablePlans}
          />
          
          <CancelSubscriptionModal
            isOpen={activeModal === 'cancel'}
            onClose={closeModal}
            organization={selectedOrganization}
          />
          
          <RenewSubscriptionModal
            isOpen={activeModal === 'renew'}
            onClose={closeModal}
            organization={selectedOrganization}
            availablePlans={availablePlans}
          />
        </>
      )}
    </div>
  );
}