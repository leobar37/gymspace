'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { 
  History, 
  Download, 
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Building2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSubscriptionHistory } from '@/features/admin/subscriptions/hooks/useAnalytics';

interface SubscriptionHistoryModalProps {
  organizationId: string;
  open: boolean;
  onClose: () => void;
}

export function SubscriptionHistoryModal({
  organizationId,
  open,
  onClose,
}: SubscriptionHistoryModalProps) {
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});

  const { data: history, isLoading } = useSubscriptionHistory(organizationId, dateRange);

  const getOperationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'upgrade':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'downgrade':
        return <TrendingDown className="h-4 w-4 text-yellow-600" />;
      case 'cancel':
      case 'cancellation':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'activation':
      case 'reactivation':
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      case 'renewal':
        return <Package className="h-4 w-4 text-purple-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getOperationBadge = (type: string) => {
    const variant = 
      type === 'upgrade' ? 'success' :
      type === 'downgrade' ? 'warning' :
      type === 'cancel' || type === 'cancellation' ? 'destructive' :
      'default';

    return <Badge variant={variant as any}>{type}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variant = 
      status === 'completed' || status === 'active' ? 'success' :
      status === 'pending' ? 'warning' :
      status === 'failed' ? 'destructive' :
      'secondary';

    return <Badge variant={variant as any}>{status}</Badge>;
  };

  const handleExport = () => {
    if (!history) return;

    // Create CSV content
    const headers = ['Date', 'Operation', 'From Plan', 'To Plan', 'Amount', 'Status', 'Performed By', 'Notes'];
    const rows = history.operations.map(op => [
      format(new Date(op.performedAt), 'yyyy-MM-dd HH:mm'),
      op.type,
      op.planFrom || 'N/A',
      op.planTo || 'N/A',
      `$${op.amount}`,
      op.status,
      op.performedBy,
      op.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscription-history-${history.organization.name.replace(/\s+/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5" />
              <DialogTitle>Subscription History</DialogTitle>
            </div>
            {history && (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
          <DialogDescription>
            Complete subscription history and operations for this organization
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : history ? (
          <div className="space-y-6">
            {/* Organization Summary */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">Organization Overview</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{history.organization.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Plan</p>
                    <Badge variant="outline">
                      {history.organization.currentPlan || 'None'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {getStatusBadge(history.organization.subscriptionStatus)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                    <p className="font-semibold text-green-600">
                      ${history.organization.totalSpent.toLocaleString()}
                    </p>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Joined</p>
                    <p className="font-medium">
                      {format(new Date(history.organization.joinedAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Operations</p>
                    <p className="font-medium">{history.summary.totalOperations}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Plan Changes</p>
                    <p className="font-medium">{history.summary.planChanges}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Subscription</p>
                    <p className="font-medium">
                      {history.summary.averageSubscriptionLength} months
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Date Filter */}
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filter by date:</span>
              </div>
              <input
                type="date"
                className="text-sm border rounded px-2 py-1"
                placeholder="From"
                value={dateRange.from || ''}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              />
              <span className="text-sm text-muted-foreground">to</span>
              <input
                type="date"
                className="text-sm border rounded px-2 py-1"
                placeholder="To"
                value={dateRange.to || ''}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              />
              {(dateRange.from || dateRange.to) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateRange({})}
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Operations History */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Operations History</h3>
              <ScrollArea className="h-[350px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">Date</TableHead>
                      <TableHead>Operation</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Performed By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.operations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No operations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      history.operations.map((operation) => (
                        <TableRow key={operation.id}>
                          <TableCell className="font-mono text-sm">
                            {format(new Date(operation.performedAt), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getOperationIcon(operation.type)}
                              <span className="font-medium">{operation.type}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {operation.planFrom ? (
                              <Badge variant="outline">{operation.planFrom}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {operation.planTo ? (
                              <Badge variant="outline">{operation.planTo}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              <span className="font-medium">{operation.amount}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(operation.status)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {operation.performedBy}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            {/* Financial Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Financial Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${history.summary.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Subscription length: {history.summary.averageSubscriptionLength} months average
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {history.summary.planChanges} plan changes • {history.summary.totalOperations} total operations
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}