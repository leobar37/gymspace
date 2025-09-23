import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  BuildingIcon,
  UsersIcon,
  UserIcon,
  AlertTriangleIcon
} from 'lucide-react';

interface UsageDisplayProps {
  usage: {
    gyms: number;
    totalClients: number;
    totalUsers: number;
  };
  limits: {
    maxGyms: number;
    maxClientsPerGym: number;
    maxUsersPerGym: number;
  };
  compact?: boolean;
}

export function UsageDisplay({ usage, limits, compact = false }: UsageDisplayProps) {
  const calculatePercentage = (current: number, max: number) => {
    if (max === 0) return 0;
    return Math.min((current / max) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const gymPercentage = calculatePercentage(usage.gyms, limits.maxGyms);
  const clientsPercentage = calculatePercentage(
    usage.totalClients,
    limits.maxGyms * limits.maxClientsPerGym
  );
  const usersPercentage = calculatePercentage(
    usage.totalUsers,
    limits.maxGyms * limits.maxUsersPerGym
  );

  if (compact) {
    return (
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <BuildingIcon className="size-3.5 text-muted-foreground" />
          <span className={cn('font-medium', getUsageColor(gymPercentage))}>
            {usage.gyms}/{limits.maxGyms}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <UsersIcon className="size-3.5 text-muted-foreground" />
          <span className={cn('font-medium', getUsageColor(clientsPercentage))}>
            {usage.totalClients}/{limits.maxGyms * limits.maxClientsPerGym}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <UserIcon className="size-3.5 text-muted-foreground" />
          <span className={cn('font-medium', getUsageColor(usersPercentage))}>
            {usage.totalUsers}/{limits.maxGyms * limits.maxUsersPerGym}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Gyms Usage */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <BuildingIcon className="size-4 text-muted-foreground" />
            <span className="font-medium">Gimnasios</span>
          </div>
          <span className={cn('font-medium', getUsageColor(gymPercentage))}>
            {usage.gyms} / {limits.maxGyms}
          </span>
        </div>
        <Progress
          value={gymPercentage}
          className="h-2"
          indicatorClassName={getProgressColor(gymPercentage)}
        />
        {gymPercentage >= 90 && (
          <div className="flex items-center gap-1 text-xs text-red-600">
            <AlertTriangleIcon className="size-3" />
            <span>Límite casi alcanzado</span>
          </div>
        )}
      </div>

      {/* Clients Usage */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <UsersIcon className="size-4 text-muted-foreground" />
            <span className="font-medium">Clientes Totales</span>
          </div>
          <span className={cn('font-medium', getUsageColor(clientsPercentage))}>
            {usage.totalClients} / {limits.maxGyms * limits.maxClientsPerGym}
          </span>
        </div>
        <Progress
          value={clientsPercentage}
          className="h-2"
          indicatorClassName={getProgressColor(clientsPercentage)}
        />
        <div className="text-xs text-muted-foreground">
          Máx. {limits.maxClientsPerGym} por gimnasio
        </div>
      </div>

      {/* Users Usage */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <UserIcon className="size-4 text-muted-foreground" />
            <span className="font-medium">Usuarios Totales</span>
          </div>
          <span className={cn('font-medium', getUsageColor(usersPercentage))}>
            {usage.totalUsers} / {limits.maxGyms * limits.maxUsersPerGym}
          </span>
        </div>
        <Progress
          value={usersPercentage}
          className="h-2"
          indicatorClassName={getProgressColor(usersPercentage)}
        />
        <div className="text-xs text-muted-foreground">
          Máx. {limits.maxUsersPerGym} por gimnasio
        </div>
      </div>
    </div>
  );
}