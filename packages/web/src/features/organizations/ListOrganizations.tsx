'use client';
import React, { useState, useMemo } from 'react';
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
  CalendarIcon,
  Building2Icon,
  MailIcon,
  EditIcon,
  EyeIcon,
  TrashIcon,
  RefreshCwIcon,
} from 'lucide-react';
import { GenericTable, Column, SortConfig } from '@/components/ui/generic-table';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { useOrganizations, OrganizationWithDetails } from './hooks/useOrganizations';
import { formatDate, formatDateTime } from '@/lib/utils';

export function ListOrganizations() {
  const { data: organizations = [], isLoading, error, refetch } = useOrganizations();
  
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: 'asc',
  });
  

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return organizations;

    const sorted = [...organizations].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortConfig.key === 'owner') {
        aValue = a.owner.fullName;
        bValue = b.owner.fullName;
      } else if (sortConfig.key === 'gyms') {
        aValue = a.gyms.length;
        bValue = b.gyms.length;
      } else {
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

  // Table columns definition
  const columns: Column<OrganizationWithDetails>[] = [
    {
      key: 'name',
      header: 'Organización',
      sortable: true,
      accessor: (org) => (
        <div className="flex items-center gap-2">
          <BuildingIcon className="size-4 text-muted-foreground" />
          <div className="font-medium">{org.name}</div>
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
      key: 'gyms',
      header: 'Gimnasios',
      sortable: true,
      accessor: (org) => (
        org.gyms.length === 0 ? (
          <span className="text-sm text-muted-foreground">
            Sin gimnasios
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
                +{org.gyms.length - 2} más
              </span>
            )}
          </div>
        )
      ),
    },
    {
      key: 'createdAt',
      header: 'Fecha de creación',
      sortable: true,
      accessor: (org) => (
        <div className="flex items-center gap-2">
          <CalendarIcon className="size-3 text-muted-foreground" />
          <span className="text-sm" title={formatDateTime(org.createdAt)}>
            {formatDate(org.createdAt)}
          </span>
        </div>
      ),
    },
  ];

  const renderActions = (_org: OrganizationWithDetails) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <EyeIcon className="size-4 mr-2" />
          Ver detalles
        </DropdownMenuItem>
        <DropdownMenuItem>
          <EditIcon className="size-4 mr-2" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive">
          <TrashIcon className="size-4 mr-2" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          {/* Header with refresh button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCwIcon className={`size-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>

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
                title="No hay organizaciones"
                description="No se encontraron organizaciones. Intenta actualizar la página."
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
            loadingState={<TableSkeleton rows={5} columns={5} />}
            actions={renderActions}
          />
        </div>
      </div>
    </div>
  );
}