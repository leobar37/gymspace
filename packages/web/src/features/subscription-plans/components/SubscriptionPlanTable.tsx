'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontalIcon,
  EditIcon,
  EyeIcon,
  TrashIcon,
  CalendarIcon,
  UsersIcon,
  Building2Icon,
  CreditCardIcon,
} from 'lucide-react';
import { GenericTable, Column } from '@/components/ui/generic-table';
import { Badge } from '@/components/ui/badge';
import { SubscriptionPlanDto } from '@gymspace/sdk';
import { formatDate, formatDateTime } from '@/lib/utils';
import { PricingDisplay } from './PricingDisplay';
import { PlanFeaturesList } from './PlanFeaturesList';

interface SubscriptionPlanTableProps {
  plans: SubscriptionPlanDto[];
  onView: (plan: SubscriptionPlanDto) => void;
  onEdit: (plan: SubscriptionPlanDto) => void;
  onDelete: (planId: string) => void;
  sortConfig?: {
    key: string | null;
    direction: 'asc' | 'desc';
  };
  onSort?: (key: string) => void;
  isLoading?: boolean;
  error?: Error | null;
}

export function SubscriptionPlanTable({
  plans,
  onView,
  onEdit,
  onDelete,
  sortConfig,
  onSort,
  isLoading = false,
  error = null,
}: SubscriptionPlanTableProps) {
  const columns: Column<SubscriptionPlanDto>[] = [
    {
      key: 'name',
      header: 'Plan Name',
      sortable: true,
      accessor: (plan) => (
        <div className="flex items-center gap-2">
          <CreditCardIcon className="size-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{plan.name}</div>
            {plan.description && (
              <div className="text-xs text-muted-foreground line-clamp-1">
                {plan.description}
              </div>
            )}
          </div>
          {plan.isActive ? (
            <Badge variant="default" className="ml-2">
              Active
            </Badge>
          ) : (
            <Badge variant="secondary" className="ml-2">
              Inactive
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'pricing',
      header: 'Pricing',
      sortable: true,
      accessor: (plan) => (
        <PricingDisplay
          pricing={plan.price}
          billingFrequency={plan.billingFrequency}
          compact
        />
      ),
    },
    {
      key: 'limits',
      header: 'Limits',
      accessor: (plan) => (
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <Building2Icon className="size-3 text-muted-foreground" />
            <span>{plan.maxGyms} gyms</span>
          </div>
          <div className="flex items-center gap-2">
            <UsersIcon className="size-3 text-muted-foreground" />
            <span>{plan.maxClientsPerGym} clients/gym</span>
          </div>
          <div className="flex items-center gap-2">
            <UsersIcon className="size-3 text-muted-foreground" />
            <span>{plan.maxUsersPerGym} users/gym</span>
          </div>
        </div>
      ),
    },
    {
      key: 'features',
      header: 'Features',
      accessor: (plan) => (
        <PlanFeaturesList features={plan.features} compact />
      ),
    },
    {
      key: 'activeSubscriptions',
      header: 'Active Subscriptions',
      sortable: true,
      accessor: (plan) => (
        <div className="text-center">
          <span className="font-medium">{plan.activeSubscriptions || 0}</span>
          {plan.totalOrganizations && plan.totalOrganizations > 0 && (
            <span className="text-xs text-muted-foreground block">
              of {plan.totalOrganizations} total
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      sortable: true,
      accessor: (plan) => (
        <div className="flex items-center gap-2">
          <CalendarIcon className="size-3 text-muted-foreground" />
          <span className="text-sm" title={formatDateTime(plan.createdAt)}>
            {formatDate(plan.createdAt)}
          </span>
        </div>
      ),
    },
  ];

  const renderActions = (plan: SubscriptionPlanDto) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onView(plan)}>
          <EyeIcon className="size-4 mr-2" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(plan)}>
          <EditIcon className="size-4 mr-2" />
          Edit Plan
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onDelete(plan.id)}
          disabled={(plan.activeSubscriptions || 0) > 0}
        >
          <TrashIcon className="size-4 mr-2" />
          Delete Plan
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <GenericTable
      data={plans}
      columns={columns}
      keyExtractor={(plan) => plan.id}
      sortConfig={sortConfig}
      onSort={onSort}
      loading={isLoading}
      error={error}
      actions={renderActions}
    />
  );
}