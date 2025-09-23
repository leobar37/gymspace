'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ErrorState } from '@/components/ui/error-state';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import {
  ArrowLeftIcon,
  RefreshCwIcon,
  TrendingUpIcon,
  XCircleIcon,
  Building2Icon,
  CreditCardIcon,
} from 'lucide-react';
import { useOrganizationDetails } from './hooks/useOrganizationDetails';
// import { useSubscriptionPlan } from './hooks/useSubscriptionPlan'; // TODO: Use when plan ID is available
import { OrganizationInfoCard } from './components/OrganizationInfoCard';
import { SubscriptionInfoCard } from './components/SubscriptionInfoCard';
import { UsageStatisticsCard } from './components/UsageStatisticsCard';
import { SubscriptionHistoryCard } from './components/SubscriptionHistoryCard';
import { SubscriptionUpgradeModal } from './components/SubscriptionUpgradeModal';
import { SubscriptionRenewalModal } from './components/SubscriptionRenewalModal';
import { SubscriptionCancelModal } from './components/SubscriptionCancelModal';
import { SubscriptionHistoryModal } from './components/SubscriptionHistoryModal';

interface OrganizationSubscriptionDetailsProps {
  organizationId: string;
}

export function OrganizationSubscriptionDetails({
  organizationId,
}: OrganizationSubscriptionDetailsProps) {
  const router = useRouter();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const {
    data: organization,
    isLoading,
    error,
    refetch,
  } = useOrganizationDetails(organizationId);

  // Get the subscription plan details if organization has subscription
  // Note: We would need the subscriptionPlanId from the subscription object
  // For now, we'll skip fetching the plan details as the ID field may not be available
  const subscriptionPlan = undefined; // Placeholder until we have proper plan ID from subscription

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <TableSkeleton rows={5} columns={4} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorState
            error={error as Error}
            icon={Building2Icon}
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Organization not found</p>
          </div>
        </div>
      </div>
    );
  }

  const handleUpgrade = () => {
    setUpgradeModalOpen(true);
  };

  const handleRenew = () => {
    setRenewModalOpen(true);
  };

  const handleCancel = () => {
    setCancelModalOpen(true);
  };

  const handleViewFullHistory = () => {
    setHistoryModalOpen(true);
  };

  const showQuickActions = organization.subscription && !organization.subscription.isExpired;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/organization-subscriptions">Organization Subscriptions</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{organization.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-8 w-8"
            >
              <ArrowLeftIcon className="size-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{organization.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Subscription & Organization Details
              </p>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCwIcon className={`size-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {showQuickActions && (
              <>
                <Button variant="default" size="sm" onClick={handleUpgrade}>
                  <TrendingUpIcon className="size-4 mr-2" />
                  Upgrade Plan
                </Button>
                <Button variant="outline" size="sm" onClick={handleRenew}>
                  <RefreshCwIcon className="size-4 mr-2" />
                  Renew
                </Button>
              </>
            )}
            {organization.subscription?.isExpired && (
              <Button variant="default" size="sm" onClick={handleRenew}>
                <RefreshCwIcon className="size-4 mr-2" />
                Activate Renewal
              </Button>
            )}
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Organization Information */}
          <OrganizationInfoCard organization={organization} />

          {/* Subscription Information */}
          <SubscriptionInfoCard organization={organization} />

          {/* Usage Statistics */}
          <UsageStatisticsCard
            organization={organization}
            subscriptionPlan={subscriptionPlan}
          />

          {/* Recent History */}
          <SubscriptionHistoryCard
            organizationId={organizationId}
            onViewFullHistory={handleViewFullHistory}
          />
        </div>

        {/* Quick Actions Section */}
        {organization.subscription && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCardIcon className="size-5 text-primary" />
              Quick Actions
            </h2>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleUpgrade} variant="default">
                <TrendingUpIcon className="size-4 mr-2" />
                Upgrade Plan
              </Button>
              <Button onClick={handleRenew} variant="outline">
                <RefreshCwIcon className="size-4 mr-2" />
                Renew Subscription
              </Button>
              <Button onClick={handleCancel} variant="outline" className="text-destructive hover:text-destructive">
                <XCircleIcon className="size-4 mr-2" />
                Cancel Subscription
              </Button>
              <Button onClick={handleViewFullHistory} variant="outline">
                View Full History
              </Button>
            </div>
          </div>
        )}

        {/* Action Modals */}
        <SubscriptionUpgradeModal
          organizationId={organizationId}
          isOpen={upgradeModalOpen}
          onOpenChange={setUpgradeModalOpen}
        />
        <SubscriptionRenewalModal
          organizationId={organizationId}
          isOpen={renewModalOpen}
          onOpenChange={setRenewModalOpen}
        />
        <SubscriptionCancelModal
          organizationId={organizationId}
          isOpen={cancelModalOpen}
          onOpenChange={setCancelModalOpen}
        />
        <SubscriptionHistoryModal
          organizationId={organizationId}
          isOpen={historyModalOpen}
          onOpenChange={setHistoryModalOpen}
        />
      </div>
    </div>
  );
}