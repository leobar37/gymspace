'use client';

import { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign,
  Activity,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  RefreshCw,
  Building2,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useSubscriptionAnalytics,
  useRevenueAnalytics,
  useUsageTrends,
  useAnalyticsDashboard,
} from '@/features/admin/subscriptions/hooks/useAnalytics';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { SubscriptionHistoryModal } from './SubscriptionHistoryModal';

// Simple chart components (you can replace with a proper charting library)
const SimpleLineChart = ({ data, height = 200 }: { data: any[]; height?: number }) => {
  if (!data || data.length === 0) return null;
  
  const maxValue = Math.max(...data.map(d => d.value || 0));
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 100 - ((d.value || 0) / maxValue) * 100,
  }));

  return (
    <div className="relative" style={{ height }}>
      <svg className="w-full h-full">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          points={points.map(p => `${p.x},${p.y}`).join(' ')}
          className="text-primary"
        />
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground">
        {data.slice(0, 5).map((d, i) => (
          <span key={i}>{format(new Date(d.date), 'MMM d')}</span>
        ))}
      </div>
    </div>
  );
};

const MetricCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon,
  trend = 'neutral',
  format: formatValue = (v) => v 
}: {
  title: string;
  value: any;
  change?: number;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
  format?: (value: any) => string;
}) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(value)}</div>
        {change !== undefined && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : trend === 'down' ? (
              <TrendingDown className="h-3 w-3 text-red-600" />
            ) : null}
            <span className={
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : ''
            }>
              {change > 0 ? '+' : ''}{change}%
            </span>
            <span>from last period</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: startOfMonth(new Date()).toISOString().split('T')[0],
    to: endOfMonth(new Date()).toISOString().split('T')[0],
  });
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Fetch analytics data
  const { data: dashboardData, isLoading, refetch } = useAnalyticsDashboard(dateRange);
  const { data: subscriptionData } = useSubscriptionAnalytics(dateRange);
  const { data: revenueData } = useRevenueAnalytics(dateRange);
  const { data: usageData } = useUsageTrends(dateRange);

  const handleExport = (type: string) => {
    // Implementation for exporting data
    console.log(`Exporting ${type} data...`);
    // You would typically call an API endpoint to generate and download a CSV/Excel file
  };

  const handleQuickDateRange = (range: string) => {
    const today = new Date();
    let from: Date;
    let to = today;

    switch (range) {
      case 'last7days':
        from = subDays(today, 7);
        break;
      case 'last30days':
        from = subDays(today, 30);
        break;
      case 'thisMonth':
        from = startOfMonth(today);
        to = endOfMonth(today);
        break;
      case 'last3months':
        from = subDays(today, 90);
        break;
      default:
        from = startOfMonth(today);
    }

    setDateRange({
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    });
  };

  const openHistoryModal = (organizationId: string) => {
    setSelectedOrganizationId(organizationId);
    setHistoryModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive subscription and revenue analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="thisMonth" onValueChange={handleQuickDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7days">Last 7 days</SelectItem>
              <SelectItem value="last30days">Last 30 days</SelectItem>
              <SelectItem value="thisMonth">This month</SelectItem>
              <SelectItem value="last3months">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Monthly Recurring Revenue"
          value={revenueData?.summary.mrr || 0}
          change={revenueData?.revenueGrowth.monthlyGrowth}
          icon={DollarSign}
          trend={revenueData?.revenueGrowth.monthlyGrowth > 0 ? 'up' : 'down'}
          format={(v) => `$${v.toLocaleString()}`}
        />
        <MetricCard
          title="Active Subscriptions"
          value={subscriptionData?.overview.activeSubscriptions || 0}
          change={subscriptionData?.overview.growthRate}
          icon={Users}
          trend={subscriptionData?.overview.growthRate > 0 ? 'up' : 'down'}
        />
        <MetricCard
          title="Churn Rate"
          value={subscriptionData?.overview.churnRate || 0}
          icon={TrendingDown}
          trend="neutral"
          format={(v) => `${v.toFixed(1)}%`}
        />
        <MetricCard
          title="Avg Revenue Per User"
          value={revenueData?.summary.averageRevenuePerUser || 0}
          icon={CreditCard}
          trend="neutral"
          format={(v) => `$${v.toFixed(2)}`}
        />
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="subscriptions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="usage">Usage Trends</TabsTrigger>
          <TabsTrigger value="organizations">Top Organizations</TabsTrigger>
        </TabsList>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Subscription Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription Trends</CardTitle>
                <CardDescription>Active subscriptions over time</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleLineChart 
                  data={subscriptionData?.subscriptionTrends.map(t => ({
                    date: t.date,
                    value: t.active
                  })) || []}
                />
              </CardContent>
            </Card>

            {/* Plan Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Plan Distribution</CardTitle>
                <CardDescription>Subscriptions by plan type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {subscriptionData?.subscriptionsByPlan.map((plan) => (
                  <div key={plan.planId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{plan.planName}</span>
                      <span className="text-sm text-muted-foreground">
                        {plan.count} ({plan.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={plan.percentage} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Retention Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Retention Metrics</CardTitle>
              <CardDescription>Customer retention and churn analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm font-medium">Average Lifetime</p>
                  <p className="text-2xl font-bold">
                    {subscriptionData?.retentionMetrics.averageLifetime || 0} months
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Retention Rate</p>
                  <p className="text-2xl font-bold">
                    {subscriptionData?.retentionMetrics.retentionRate || 0}%
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Top Churn Reason</p>
                  <p className="text-lg font-semibold">
                    {subscriptionData?.retentionMetrics.churnReasons[0]?.reason || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Revenue Trends */}
            <Card>
              <CardHeader>
                <CardTitle>MRR Trends</CardTitle>
                <CardDescription>Monthly recurring revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleLineChart 
                  data={revenueData?.revenueTrends.map(t => ({
                    date: t.date,
                    value: t.mrr
                  })) || []}
                />
              </CardContent>
            </Card>

            {/* Revenue by Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Plan</CardTitle>
                <CardDescription>MRR breakdown by subscription plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {revenueData?.revenueByPlan.map((plan) => (
                  <div key={plan.planId} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{plan.planName}</p>
                      <p className="text-xs text-muted-foreground">
                        {plan.subscribers} subscribers
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">${plan.mrr.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {plan.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Revenue Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Summary</CardTitle>
              <CardDescription>Key revenue metrics and projections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5">
                <div>
                  <p className="text-sm text-muted-foreground">MRR</p>
                  <p className="text-xl font-bold">${revenueData?.summary.mrr.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ARR</p>
                  <p className="text-xl font-bold">${revenueData?.summary.arr.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-xl font-bold">
                    ${revenueData?.summary.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ARPU</p>
                  <p className="text-xl font-bold">
                    ${revenueData?.summary.averageRevenuePerUser.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Projected</p>
                  <p className="text-xl font-bold">
                    ${revenueData?.summary.projectedRevenue.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Trends Tab */}
        <TabsContent value="usage" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard
              title="Total Organizations"
              value={usageData?.overview.totalOrganizations || 0}
              icon={Building2}
              trend="neutral"
            />
            <MetricCard
              title="Active Organizations"
              value={usageData?.overview.activeOrganizations || 0}
              icon={Activity}
              trend="neutral"
            />
            <MetricCard
              title="Avg Gyms per Org"
              value={usageData?.overview.averageGymsPerOrg || 0}
              icon={BarChart3}
              trend="neutral"
              format={(v) => v.toFixed(1)}
            />
            <MetricCard
              title="Avg Users per Org"
              value={usageData?.overview.averageUsersPerOrg || 0}
              icon={Users}
              trend="neutral"
              format={(v) => v.toFixed(1)}
            />
          </div>

          {/* Usage by Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Usage by Plan</CardTitle>
              <CardDescription>Resource utilization across different plans</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">Avg Gyms</TableHead>
                    <TableHead className="text-right">Avg Users</TableHead>
                    <TableHead className="text-right">Avg Clients</TableHead>
                    <TableHead className="text-right">Utilization</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usageData?.usageByPlan.map((plan) => (
                    <TableRow key={plan.planId}>
                      <TableCell className="font-medium">{plan.planName}</TableCell>
                      <TableCell className="text-right">{plan.avgGyms.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{plan.avgUsers.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{plan.avgClients.toFixed(0)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={
                          plan.utilizationRate > 80 ? 'destructive' :
                          plan.utilizationRate > 60 ? 'warning' :
                          'success'
                        }>
                          {plan.utilizationRate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Organizations Tab */}
        <TabsContent value="organizations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Top Organizations</CardTitle>
                  <CardDescription>Organizations by revenue and usage</CardDescription>
                </div>
                <Button onClick={() => handleExport('organizations')} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">Gyms</TableHead>
                    <TableHead className="text-right">Users</TableHead>
                    <TableHead className="text-right">Clients</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usageData?.topOrganizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{org.plan}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{org.gyms}</TableCell>
                      <TableCell className="text-right">{org.users}</TableCell>
                      <TableCell className="text-right">{org.clients}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ${org.revenue.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openHistoryModal(org.id)}
                        >
                          View History
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Subscription History Modal */}
      {selectedOrganizationId && (
        <SubscriptionHistoryModal
          organizationId={selectedOrganizationId}
          open={historyModalOpen}
          onClose={() => {
            setHistoryModalOpen(false);
            setSelectedOrganizationId(null);
          }}
        />
      )}
    </div>
  );
}