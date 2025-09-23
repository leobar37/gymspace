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
  BuildingIcon,
  UserIcon,
  MailIcon,
  ArrowUpIcon,
  RefreshCcwIcon,
  XCircleIcon,
  ClockIcon,
} from 'lucide-react';
import { GenericTable, Column, SortConfig } from '@/components/ui/generic-table';
import { OrganizationWithSubscription } from '../hooks/useOrganizationSubscriptions';
import { SubscriptionStatusBadge } from './SubscriptionStatusBadge';
import { UsageDisplay } from './UsageDisplay';
import { useRouter } from 'next/navigation';

interface OrganizationSubscriptionTableProps {
  data: OrganizationWithSubscription[];
  sortConfig: SortConfig;
  onSort: (key: string) => void;
  onUpgrade: (org: OrganizationWithSubscription) => void;
  onRenew: (org: OrganizationWithSubscription) => void;
  onCancel: (org: OrganizationWithSubscription) => void;
  onHistory: (org: OrganizationWithSubscription) => void;
  isLoading?: boolean;
  error?: Error | null;
  onRefetch?: () => void;
}

export function OrganizationSubscriptionTable({
  data,
  sortConfig,
  onSort,
  onUpgrade,
  onRenew,
  onCancel,
  onHistory,
  isLoading,
  error,
  onRefetch,
}: OrganizationSubscriptionTableProps) {
  const router = useRouter();

  const handleRowClick = (organization: OrganizationWithSubscription) => {
    router.push(`/organization-subscriptions/${organization.id}`);
  };

  const formatPlanPrice = (plan?: OrganizationWithSubscription['subscriptionPlan']) => {
    if (!plan) return '-';

    const price = plan.price?.PEN;
    if (!price) return 'Sin precio';

    const formattedPrice = new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(price.value);

    return (
      <div>
        <div className="font-medium">{plan.name}</div>
        <div className="text-xs text-muted-foreground">
          {formattedPrice} / {plan.billingFrequency === 'monthly' ? 'mes' : plan.billingFrequency}
        </div>
      </div>
    );
  };

  const columns: Column<OrganizationWithSubscription>[] = [
    {
      key: 'name',
      header: 'Organización',
      sortable: true,
      accessor: (org) => (
        <div className="flex items-center gap-2">
          <BuildingIcon className="size-4 text-muted-foreground" />
          <div className="font-medium cursor-pointer hover:text-primary">
            {org.name}
          </div>
        </div>
      ),
    },
    {
      key: 'owner',
      header: 'Propietario',
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
      key: 'plan',
      header: 'Plan Actual',
      sortable: true,
      accessor: (org) => formatPlanPrice(org.subscriptionPlan),
    },
    {
      key: 'status',
      header: 'Estado',
      sortable: true,
      accessor: (org) => (
        <SubscriptionStatusBadge
          status={org.subscriptionStatus || 'inactive'}
          endDate={org.subscription?.endDate}
          daysRemaining={org.subscription?.daysRemaining}
          compact
        />
      ),
    },
    {
      key: 'usage',
      header: 'Uso',
      sortable: false,
      accessor: (org) => {
        if (!org.subscriptionPlan || !org.usage) {
          return <span className="text-sm text-muted-foreground">Sin datos</span>;
        }

        return (
          <UsageDisplay
            usage={org.usage}
            limits={{
              maxGyms: org.subscriptionPlan.maxGyms,
              maxClientsPerGym: org.subscriptionPlan.maxClientsPerGym,
              maxUsersPerGym: org.subscriptionPlan.maxUsersPerGym,
            }}
            compact
          />
        );
      },
    },
  ];

  const renderActions = (org: OrganizationWithSubscription) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="size-8">
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={() => onUpgrade(org)}>
          <ArrowUpIcon className="size-4 mr-2" />
          Actualizar Plan
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onRenew(org)}>
          <RefreshCcwIcon className="size-4 mr-2" />
          Renovar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onHistory(org)}>
          <ClockIcon className="size-4 mr-2" />
          Ver Historial
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onCancel(org)}
        >
          <XCircleIcon className="size-4 mr-2" />
          Cancelar Suscripción
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <GenericTable
      data={data}
      columns={columns}
      keyExtractor={(org) => org.id}
      sortConfig={sortConfig}
      onSort={onSort}
      loading={isLoading}
      error={error}
      onRowClick={handleRowClick}
      actions={renderActions}
      rowClassName="transition-colors"
    />
  );
}