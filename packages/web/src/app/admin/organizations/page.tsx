'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { 
  MoreHorizontal,
  Building2,
  Users,
  CreditCard,
  RefreshCw,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  TrendingDown,
  Zap,
  Mail
} from 'lucide-react';
import { useAdminOrganizations } from '@/features/admin/subscriptions/hooks/useAdminOrganizations';
import { formatDate, formatDateTime } from '@/lib/utils';

export default function AdminOrganizationsPage() {
  const { data: organizations = [], isLoading, error, refetch } = useAdminOrganizations();

  const getSubscriptionStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'TRIAL':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><Clock className="w-3 h-3 mr-1" />Trial</Badge>;
      case 'EXPIRED':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-orange-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getDaysUntilExpiry = (expiryDate: Date) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive mb-4">Failed to load organizations</p>
              <Button onClick={() => refetch()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">
            Manage organizations and their subscriptions
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizations.filter(org => org.subscription?.status === 'ACTIVE').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizations.filter(org => {
                if (!org.subscription?.expiresAt) return false;
                const days = getDaysUntilExpiry(org.subscription.expiresAt);
                return days > 0 && days <= 30;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Within 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial Accounts</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizations.filter(org => org.subscription?.status === 'TRIAL').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Organizations</CardTitle>
          <CardDescription>
            View and manage organization subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Usage vs Limits</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading organizations...
                  </TableCell>
                </TableRow>
              ) : organizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No organizations found.
                  </TableCell>
                </TableRow>
              ) : (
                organizations.map((org) => {
                  const subscription = org.subscription || {
                    plan: 'Free Plan',
                    status: 'ACTIVE',
                    usage: { gyms: 0, clients: 0, users: 0 },
                    limits: { gyms: 1, clients: 50, users: 2 }
                  };
                  
                  return (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{org.name}</p>
                          <p className="text-sm text-muted-foreground">{org.owner.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{subscription.plan}</p>
                            {subscription.price && (
                              <p className="text-sm text-muted-foreground">
                                ${subscription.price}/mo
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <div className="flex-1">
                              <div className="flex justify-between text-xs mb-1">
                                <span>Gyms</span>
                                <span className={getUsageColor(getUsagePercentage(subscription.usage.gyms, subscription.limits.gyms))}>
                                  {subscription.usage.gyms}/{subscription.limits.gyms === -1 ? '∞' : subscription.limits.gyms}
                                </span>
                              </div>
                              <Progress 
                                value={getUsagePercentage(subscription.usage.gyms, subscription.limits.gyms)} 
                                className="h-1"
                              />
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <div className="flex-1">
                              <div className="flex justify-between text-xs mb-1">
                                <span>Clients</span>
                                <span className={getUsageColor(getUsagePercentage(subscription.usage.clients, subscription.limits.clients))}>
                                  {subscription.usage.clients}/{subscription.limits.clients === -1 ? '∞' : subscription.limits.clients}
                                </span>
                              </div>
                              <Progress 
                                value={getUsagePercentage(subscription.usage.clients, subscription.limits.clients)} 
                                className="h-1"
                              />
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getSubscriptionStatusBadge(subscription.status)}
                      </TableCell>
                      <TableCell>
                        {subscription.expiresAt ? (
                          <div>
                            <p className="text-sm">{formatDate(subscription.expiresAt)}</p>
                            {(() => {
                              const days = getDaysUntilExpiry(subscription.expiresAt);
                              if (days <= 0) return <p className="text-xs text-red-600">Expired</p>;
                              if (days <= 7) return <p className="text-xs text-red-600">{days} days left</p>;
                              if (days <= 30) return <p className="text-xs text-orange-600">{days} days left</p>;
                              return <p className="text-xs text-muted-foreground">{days} days left</p>;
                            })()}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No expiry</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Subscription Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <TrendingUp className="h-4 w-4 mr-2" />
                              Upgrade Plan
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <TrendingDown className="h-4 w-4 mr-2" />
                              Downgrade Plan
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Renew Subscription
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Zap className="h-4 w-4 mr-2" />
                              Adjust Limits
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Reminder
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel Subscription
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}