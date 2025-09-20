'use client';

import { useState, useMemo } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Search,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  useSubscriptionRequests, 
  usePendingRequests,
  useRequestAnalytics,
  useBulkProcessRequests,
  type SubscriptionRequest,
  type RequestAnalyticsQuery
} from '@/features/admin/subscriptions/hooks/useRequestManagement';
import { ApproveRequestModal } from './ApproveRequestModal';
import { RejectRequestModal } from './RejectRequestModal';
import { format } from 'date-fns';
import { useDebounce } from '@/hooks/use-debounce';

export default function SubscriptionRequestsPage() {
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SubscriptionRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Build query based on filters
  const query: RequestAnalyticsQuery = useMemo(() => {
    const q: RequestAnalyticsQuery = {
      page: 1,
      limit: 50,
      search: debouncedSearch || undefined,
    };

    if (statusFilter !== 'all') {
      q.status = statusFilter as any;
    }

    if (dateRange.from) {
      q.dateFrom = dateRange.from;
    }

    if (dateRange.to) {
      q.dateTo = dateRange.to;
    }

    return q;
  }, [debouncedSearch, statusFilter, dateRange]);

  const { data: requestsData, isLoading, refetch } = useSubscriptionRequests(query);
  const { data: pendingData } = usePendingRequests();
  const { data: analytics } = useRequestAnalytics(query);
  const bulkProcess = useBulkProcessRequests();

  const requests = requestsData?.data || [];
  const totalRequests = requestsData?.total || 0;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(new Set(requests.map(r => r.id)));
    } else {
      setSelectedRequests(new Set());
    }
  };

  const handleSelectRequest = (requestId: string, checked: boolean) => {
    const newSelection = new Set(selectedRequests);
    if (checked) {
      newSelection.add(requestId);
    } else {
      newSelection.delete(requestId);
    }
    setSelectedRequests(newSelection);
  };

  const handleBulkApprove = async () => {
    if (selectedRequests.size === 0) return;

    await bulkProcess.mutateAsync({
      requestIds: Array.from(selectedRequests),
      action: { action: 'approve' }
    });

    setSelectedRequests(new Set());
  };

  const handleBulkReject = async () => {
    if (selectedRequests.size === 0) return;

    await bulkProcess.mutateAsync({
      requestIds: Array.from(selectedRequests),
      action: { 
        action: 'reject',
        rejectionReason: 'Bulk rejection'
      }
    });

    setSelectedRequests(new Set());
  };

  const openApproveModal = (request: SubscriptionRequest) => {
    setSelectedRequest(request);
    setApproveModalOpen(true);
  };

  const openRejectModal = (request: SubscriptionRequest) => {
    setSelectedRequest(request);
    setRejectModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'cancelled':
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'upgrade':
        return <Badge variant="default"><TrendingUp className="h-3 w-3 mr-1" />Upgrade</Badge>;
      case 'downgrade':
        return <Badge variant="secondary"><TrendingDown className="h-3 w-3 mr-1" />Downgrade</Badge>;
      case 'cancel':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancel</Badge>;
      default:
        return <Badge>{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription Requests</h1>
          <p className="text-muted-foreground">
            Manage and process subscription change requests
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalRequests}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {analytics.pendingRequests}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting processing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {analytics.approvedRequests}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                This month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(analytics.averageProcessingTime / (1000 * 60 * 60))}h
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Time to process
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and search subscription requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by organization name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="From date"
              value={dateRange.from || ''}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="w-[180px]"
            />

            <Input
              type="date"
              placeholder="To date"
              value={dateRange.to || ''}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="w-[180px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedRequests.size > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {selectedRequests.size} request(s) selected
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedRequests(new Set())}
                >
                  Clear Selection
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={handleBulkApprove}
                  disabled={bulkProcess.isPending}
                >
                  Bulk Approve
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleBulkReject}
                  disabled={bulkProcess.isPending}
                >
                  Bulk Reject
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Requests</CardTitle>
          <CardDescription>
            {totalRequests} total requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedRequests.size === requests.length && requests.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Current Plan</TableHead>
                <TableHead>Requested Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                      Loading requests...
                    </div>
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No requests found
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRequests.has(request.id)}
                        onCheckedChange={(checked) => 
                          handleSelectRequest(request.id, checked as boolean)
                        }
                        disabled={request.status !== 'pending'}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {request.organizationName}
                    </TableCell>
                    <TableCell>
                      {getActionBadge(request.action)}
                    </TableCell>
                    <TableCell>
                      {request.currentPlanName || '-'}
                    </TableCell>
                    <TableCell>
                      {request.requestedPlanName || '-'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(request.status)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.requestedAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => openApproveModal(request)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openRejectModal(request)}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      {request.status === 'approved' && request.processedAt && (
                        <span className="text-sm text-muted-foreground">
                          Approved {format(new Date(request.processedAt), 'MMM d')}
                        </span>
                      )}
                      {request.status === 'rejected' && request.processedAt && (
                        <span className="text-sm text-muted-foreground">
                          Rejected {format(new Date(request.processedAt), 'MMM d')}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modals */}
      {selectedRequest && (
        <>
          <ApproveRequestModal
            request={selectedRequest}
            open={approveModalOpen}
            onClose={() => {
              setApproveModalOpen(false);
              setSelectedRequest(null);
            }}
            onSuccess={() => {
              refetch();
              setApproveModalOpen(false);
              setSelectedRequest(null);
            }}
          />

          <RejectRequestModal
            request={selectedRequest}
            open={rejectModalOpen}
            onClose={() => {
              setRejectModalOpen(false);
              setSelectedRequest(null);
            }}
            onSuccess={() => {
              refetch();
              setRejectModalOpen(false);
              setSelectedRequest(null);
            }}
          />
        </>
      )}
    </div>
  );
}