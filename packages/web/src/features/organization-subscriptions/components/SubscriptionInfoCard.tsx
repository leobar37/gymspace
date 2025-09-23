'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CreditCardIcon,
  CalendarIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from 'lucide-react';
import { OrganizationAdminDetails } from '@gymspace/sdk';
import { formatDate } from '@/lib/utils';

interface SubscriptionInfoCardProps {
  organization: OrganizationAdminDetails;
}

export function SubscriptionInfoCard({ organization }: SubscriptionInfoCardProps) {
  const subscription = organization.subscription;

  if (!subscription) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCardIcon className="size-5 text-primary" />
            Current Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <XCircleIcon className="size-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No active subscription</p>
            <p className="text-sm text-muted-foreground mt-2">
              This organization needs to activate a subscription plan
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = () => {
    if (subscription.isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (subscription.daysRemaining <= 7) {
      return <Badge variant="outline" className="border-orange-500 text-orange-600">Expiring Soon</Badge>;
    }
    if (subscription.isActive) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>;
    }
    return <Badge variant="outline">Inactive</Badge>;
  };

  const getStatusIcon = () => {
    if (subscription.isExpired) {
      return <XCircleIcon className="size-4 text-destructive" />;
    }
    if (subscription.daysRemaining <= 7) {
      return <AlertCircleIcon className="size-4 text-orange-500" />;
    }
    if (subscription.isActive) {
      return <CheckCircleIcon className="size-4 text-green-600" />;
    }
    return <ClockIcon className="size-4 text-muted-foreground" />;
  };

  const progressPercentage = Math.max(
    0,
    Math.min(100, subscription.daysRemaining > 0 ? (subscription.daysRemaining / 30) * 100 : 0)
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCardIcon className="size-5 text-primary" />
            Current Subscription
          </div>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Plan Name and Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Plan Name</span>
            <span className="font-medium text-lg">{subscription.planName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <span className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-sm capitalize">{subscription.status.toLowerCase()}</span>
            </span>
          </div>
        </div>

        {/* Subscription Timeline */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Subscription Timeline</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Start Date</span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="size-3" />
                {formatDate(subscription.startDate)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">End Date</span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="size-3" />
                {formatDate(subscription.endDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Days Remaining Progress */}
        {subscription.isActive && !subscription.isExpired && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">Time Remaining</h4>
              <span className="text-sm font-medium">
                {subscription.daysRemaining} {subscription.daysRemaining === 1 ? 'day' : 'days'}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            {subscription.daysRemaining <= 7 && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-orange-50 rounded">
                <AlertCircleIcon className="size-4 text-orange-600" />
                <p className="text-xs text-orange-700">
                  Subscription expires in {subscription.daysRemaining} days. Consider renewal.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Expired Warning */}
        {subscription.isExpired && (
          <div className="border-t pt-4">
            <div className="p-3 bg-destructive/10 rounded-md">
              <div className="flex items-start gap-2">
                <XCircleIcon className="size-5 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Subscription Expired</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This subscription expired on {formatDate(subscription.endDate)}.
                    Immediate renewal is required to restore access.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Metadata (if available) */}
        {subscription.metadata && Object.keys(subscription.metadata).length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Additional Information</h4>
            <div className="space-y-1">
              {Object.entries(subscription.metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                  <span>{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}