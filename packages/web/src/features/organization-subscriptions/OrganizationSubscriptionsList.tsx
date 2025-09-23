'use client';
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RefreshCwIcon,
  SearchIcon,
  BuildingIcon,
  FilterIcon,
} from 'lucide-react';
import { SortConfig } from '@/components/ui/generic-table';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { OrganizationSubscriptionTable } from './components/OrganizationSubscriptionTable';
import {
  useOrganizationSubscriptions,
  OrganizationWithSubscription,
  SubscriptionStatus,
} from './hooks/useOrganizationSubscriptions';
import { toast } from 'sonner';

type FilterStatus = 'all' | SubscriptionStatus;

export function OrganizationSubscriptionsList() {
  const { data: organizations = [], isLoading, error, refetch } = useOrganizationSubscriptions();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: 'asc',
  });

  // Filter by status
  const statusFilteredData = useMemo(() => {
    if (statusFilter === 'all') return organizations;

    return organizations.filter(
      (org) => org.subscriptionStatus === statusFilter
    );
  }, [organizations, statusFilter]);

  // Search functionality
  const searchFilteredData = useMemo(() => {
    if (!searchTerm.trim()) return statusFilteredData;

    const search = searchTerm.toLowerCase();
    return statusFilteredData.filter(
      (org) =>
        org.name.toLowerCase().includes(search) ||
        org.owner.fullName.toLowerCase().includes(search) ||
        org.owner.email.toLowerCase().includes(search) ||
        org.subscriptionPlan?.name?.toLowerCase().includes(search)
    );
  }, [statusFilteredData, searchTerm]);

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return searchFilteredData;

    const sorted = [...searchFilteredData].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'owner':
          aValue = a.owner.fullName;
          bValue = b.owner.fullName;
          break;
        case 'plan':
          aValue = a.subscriptionPlan?.name || '';
          bValue = b.subscriptionPlan?.name || '';
          break;
        case 'status':
          aValue = a.subscriptionStatus || '';
          bValue = b.subscriptionStatus || '';
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
  }, [searchFilteredData, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Action handlers (placeholders for now)
  const handleUpgrade = (org: OrganizationWithSubscription) => {
    toast.info(`Upgrade modal for ${org.name} will be implemented in Phase 3`);
  };

  const handleRenew = (org: OrganizationWithSubscription) => {
    toast.info(`Renewal modal for ${org.name} will be implemented in Phase 3`);
  };

  const handleCancel = (org: OrganizationWithSubscription) => {
    toast.info(`Cancel modal for ${org.name} will be implemented in Phase 3`);
  };

  const handleHistory = (org: OrganizationWithSubscription) => {
    toast.info(`History modal for ${org.name} will be implemented in Phase 3`);
  };

  // Summary stats
  const stats = useMemo(() => {
    return {
      total: organizations.length,
      active: organizations.filter((o) => o.subscriptionStatus === 'active').length,
      expiringSoon: organizations.filter((o) => o.subscriptionStatus === 'expiring_soon').length,
      expired: organizations.filter((o) => o.subscriptionStatus === 'expired').length,
      inactive: organizations.filter((o) => o.subscriptionStatus === 'inactive').length,
    };
  }, [organizations]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Suscripciones de Organizaciones
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Administra las suscripciones y planes de todas las organizaciones
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Organizaciones</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-gray-600">Activas</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">{stats.expiringSoon}</div>
              <div className="text-sm text-gray-600">Por Expirar</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-red-200">
              <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
              <div className="text-sm text-gray-600">Expiradas</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
              <div className="text-sm text-gray-600">Inactivas</div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
                  <Input
                    type="text"
                    placeholder="Buscar por organización, propietario o plan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as FilterStatus)}>
                  <SelectTrigger className="w-[180px]">
                    <FilterIcon className="size-4 mr-2" />
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="active">Activas</SelectItem>
                    <SelectItem value="expiring_soon">Por expirar</SelectItem>
                    <SelectItem value="expired">Expiradas</SelectItem>
                    <SelectItem value="inactive">Inactivas</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => refetch()}
                  disabled={isLoading}
                >
                  <RefreshCwIcon className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {error ? (
              <div className="p-8">
                <ErrorState
                  error={error as Error}
                  icon={BuildingIcon}
                  onRetry={() => refetch()}
                />
              </div>
            ) : isLoading ? (
              <div className="p-8">
                <TableSkeleton rows={5} columns={6} />
              </div>
            ) : sortedData.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={BuildingIcon}
                  title="No se encontraron organizaciones"
                  description={
                    searchTerm || statusFilter !== 'all'
                      ? 'Intenta ajustar los filtros de búsqueda'
                      : 'No hay organizaciones registradas en el sistema'
                  }
                  onRefresh={() => refetch()}
                />
              </div>
            ) : (
              <OrganizationSubscriptionTable
                data={sortedData}
                sortConfig={sortConfig}
                onSort={handleSort}
                onUpgrade={handleUpgrade}
                onRenew={handleRenew}
                onCancel={handleCancel}
                onHistory={handleHistory}
              />
            )}
          </div>

          {/* Results count */}
          {!isLoading && !error && sortedData.length > 0 && (
            <div className="text-sm text-gray-600 text-center">
              Mostrando {sortedData.length} de {organizations.length} organizaciones
            </div>
          )}
        </div>
      </div>
    </div>
  );
}