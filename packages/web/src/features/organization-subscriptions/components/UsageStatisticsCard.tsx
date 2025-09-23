'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ActivityIcon,
  UsersIcon,
  Building2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  AlertTriangleIcon,
  TrendingUpIcon
} from 'lucide-react';
import { OrganizationAdminDetails, SubscriptionPlanDto } from '@gymspace/sdk';

interface UsageStatisticsCardProps {
  organization: OrganizationAdminDetails;
  subscriptionPlan?: SubscriptionPlanDto;
}

export function UsageStatisticsCard({ organization, subscriptionPlan }: UsageStatisticsCardProps) {
  const [showGymBreakdown, setShowGymBreakdown] = useState(false);

  // Use mock limits if no subscription plan is provided
  // This is temporary until we can properly fetch the plan details
  const mockPlanLimits = subscriptionPlan || {
    maxGyms: 3,
    maxClientsPerGym: 100,
    maxUsersPerGym: 10,
  };

  // Calculate usage percentages
  const gymUsage = mockPlanLimits?.maxGyms
    ? (organization.gyms.length / mockPlanLimits.maxGyms) * 100
    : 0;

  const clientUsage = mockPlanLimits?.maxClientsPerGym
    ? ((organization.stats?.totalClients || 0) / (mockPlanLimits.maxClientsPerGym * Math.max(1, organization.gyms.length))) * 100
    : 0;

  // Mock user data for now (would come from actual API)
  const totalUsers = 5; // This should come from the actual API
  const userUsage = mockPlanLimits?.maxUsersPerGym
    ? (totalUsers / (mockPlanLimits.maxUsersPerGym * Math.max(1, organization.gyms.length))) * 100
    : 0;

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-destructive';
    if (percentage >= 75) return 'text-orange-600';
    return 'text-green-600';
  };

  const getUsageBadge = (percentage: number) => {
    if (percentage >= 90) {
      return <Badge variant="destructive" className="text-xs">Critical</Badge>;
    }
    if (percentage >= 75) {
      return <Badge variant="outline" className="border-orange-500 text-orange-600 text-xs">Warning</Badge>;
    }
    return <Badge variant="outline" className="border-green-500 text-green-600 text-xs">Healthy</Badge>;
  };

  // Always show usage with either real or mock limits

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ActivityIcon className="size-5 text-primary" />
            Usage Statistics
          </div>
          {(gymUsage >= 75 || clientUsage >= 75 || userUsage >= 75) && (
            <AlertTriangleIcon className="size-5 text-orange-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gyms Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2Icon className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Gym Locations</span>
            </div>
            {getUsageBadge(gymUsage)}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Using {organization.gyms.length} of {mockPlanLimits.maxGyms}</span>
              <span className={getUsageColor(gymUsage)}>{gymUsage.toFixed(0)}%</span>
            </div>
            <Progress value={gymUsage} className="h-2" />
          </div>
        </div>

        {/* Clients Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UsersIcon className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Clients</span>
            </div>
            {getUsageBadge(clientUsage)}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {organization.stats?.totalClients || 0} of{' '}
                {mockPlanLimits.maxClientsPerGym * Math.max(1, organization.gyms.length)} total
              </span>
              <span className={getUsageColor(clientUsage)}>{clientUsage.toFixed(0)}%</span>
            </div>
            <Progress value={clientUsage} className="h-2" />
          </div>
        </div>

        {/* Users Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UsersIcon className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Users</span>
            </div>
            {getUsageBadge(userUsage)}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {totalUsers} of {mockPlanLimits.maxUsersPerGym * Math.max(1, organization.gyms.length)} total
              </span>
              <span className={getUsageColor(userUsage)}>{userUsage.toFixed(0)}%</span>
            </div>
            <Progress value={userUsage} className="h-2" />
          </div>
        </div>

        {/* Per-Gym Breakdown (Expandable) */}
        {organization.gyms.length > 0 && (
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between"
              onClick={() => setShowGymBreakdown(!showGymBreakdown)}
            >
              <span className="text-sm font-medium">Per-Gym Breakdown</span>
              {showGymBreakdown ? (
                <ChevronUpIcon className="size-4" />
              ) : (
                <ChevronDownIcon className="size-4" />
              )}
            </Button>

            {showGymBreakdown && (
              <div className="mt-3 space-y-3">
                {organization.gyms.map((gym) => {
                  // Mock data for per-gym stats
                  const gymClients = Math.floor((organization.stats?.totalClients || 0) / organization.gyms.length);
                  const gymClientUsage = mockPlanLimits.maxClientsPerGym
                    ? (gymClients / mockPlanLimits.maxClientsPerGym) * 100
                    : 0;

                  return (
                    <div key={gym.id} className="bg-secondary/30 rounded-md p-3">
                      <h5 className="text-xs font-medium mb-2">{gym.name}</h5>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Clients</span>
                            <span>
                              {gymClients}/{mockPlanLimits.maxClientsPerGym}
                            </span>
                          </div>
                          <Progress value={gymClientUsage} className="h-1.5" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Users</span>
                            <span>
                              2/{mockPlanLimits.maxUsersPerGym}
                            </span>
                          </div>
                          <Progress value={(2 / mockPlanLimits.maxUsersPerGym) * 100} className="h-1.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Usage Warnings */}
        {(gymUsage >= 75 || clientUsage >= 75 || userUsage >= 75) && (
          <div className="border-t pt-4">
            <div className="p-3 bg-orange-50 rounded-md">
              <div className="flex items-start gap-2">
                <TrendingUpIcon className="size-4 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-orange-700">Approaching Limits</p>
                  <p className="text-xs text-orange-600 mt-1">
                    Consider upgrading to a higher plan to accommodate growth.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}