'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2, 
  CreditCard, 
  Users, 
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { usePendingRequests } from '@/features/admin/subscriptions/hooks/useRequestManagement';
import { useSubscriptionAnalytics, useRevenueAnalytics } from '@/features/admin/subscriptions/hooks/useAnalytics';
import { format } from 'date-fns';

export default function AdminDashboard() {
  // Fetch real data from API
  const { data: pendingRequests } = usePendingRequests();
  const { data: subscriptionAnalytics } = useSubscriptionAnalytics();
  const { data: revenueAnalytics } = useRevenueAnalytics();

  const stats = {
    organizations: subscriptionAnalytics?.overview?.totalSubscriptions || 0,
    activeSubscriptions: subscriptionAnalytics?.overview?.activeSubscriptions || 0,
    churnRate: subscriptionAnalytics?.overview?.churnRate || 0,
    monthlyRevenue: revenueAnalytics?.summary?.mrr || 0,
    pendingRequests: pendingRequests?.length || 0,
    growthRate: subscriptionAnalytics?.overview?.growthRate || 0
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage organizations, subscriptions, and system settings
        </p>
      </div>

      {/* Alerts Section */}
      {pendingRequests && pendingRequests.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              You have <strong>{pendingRequests.length}</strong> pending subscription requests awaiting approval.
            </span>
            <Link href="/admin/subscription-requests">
              <Button variant="outline" size="sm">
                Review Requests
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4">
        <Link href="/admin/organizations">
          <Button variant="outline" className="w-full justify-start">
            <Building2 className="h-4 w-4 mr-2" />
            Manage Organizations
          </Button>
        </Link>
        <Link href="/admin/plans">
          <Button variant="outline" className="w-full justify-start">
            <CreditCard className="h-4 w-4 mr-2" />
            Subscription Plans
          </Button>
        </Link>
        <Link href="/admin/subscription-requests">
          <Button variant="outline" className="w-full justify-start">
            <Clock className="h-4 w-4 mr-2" />
            Requests
            {pendingRequests && pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-auto">{pendingRequests.length}</Badge>
            )}
          </Button>
        </Link>
        <Link href="/admin/analytics">
          <Button variant="outline" className="w-full justify-start">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.organizations}</div>
            <p className="text-xs text-muted-foreground">
              {stats.growthRate > 0 ? (
                <span className="text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +{stats.growthRate.toFixed(1)}%
                </span>
              ) : stats.growthRate < 0 ? (
                <span className="text-red-600 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  {stats.growthRate.toFixed(1)}%
                </span>
              ) : (
                'No change'
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.activeSubscriptions / stats.organizations) * 100).toFixed(0)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.churnRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.churnRate < 5 ? (
                <span className="text-green-600">Healthy</span>
              ) : stats.churnRate < 10 ? (
                <span className="text-yellow-600">Monitor</span>
              ) : (
                <span className="text-red-600">High - Action needed</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue (MRR)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ARR: ${(stats.monthlyRevenue * 12).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.pendingRequests}
              {stats.pendingRequests > 0 && (
                <Badge variant="warning" className="ml-2">
                  Action Required
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingRequests > 0 ? (
                <Link href="/admin/subscription-requests" className="text-blue-600 hover:underline">
                  Review now →
                </Link>
              ) : (
                'All requests processed'
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Revenue Per User</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${revenueAnalytics?.summary?.averageRevenuePerUser?.toFixed(2) || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per subscription
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Requests</CardTitle>
              <CardDescription>Latest subscription change requests</CardDescription>
            </div>
            <Link href="/admin/subscription-requests">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRequests && pendingRequests.length > 0 ? (
                pendingRequests.slice(0, 3).map((request) => (
                  <div key={request.id} className="flex items-center space-x-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{request.organizationName}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.action === 'upgrade' && 'Requesting upgrade'}
                        {request.action === 'downgrade' && 'Requesting downgrade'}
                        {request.action === 'cancel' && 'Requesting cancellation'}
                        {request.requestedPlanName && ` to ${request.requestedPlanName}`}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(request.requestedAt), 'MMM d')}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-sm">All requests processed</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Plan Distribution</CardTitle>
              <CardDescription>Active subscriptions by plan</CardDescription>
            </div>
            <Link href="/admin/analytics">
              <Button variant="ghost" size="sm">
                View Analytics
                <BarChart3 className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscriptionAnalytics?.subscriptionsByPlan?.slice(0, 4).map((plan) => (
                <div key={plan.planId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{plan.planName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {plan.count} ({plan.percentage.toFixed(0)}%)
                      </span>
                      <Badge variant="outline">
                        ${plan.revenue.toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ width: `${plan.percentage}%` }}
                    />
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No subscription data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}