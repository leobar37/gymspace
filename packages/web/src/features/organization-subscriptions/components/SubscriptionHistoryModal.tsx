'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  TrendingUpIcon,
  RefreshCwIcon,
  XCircleIcon,
  DownloadIcon,
  FilterIcon,
  Loader2Icon,
  SearchIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  InfoIcon,
} from 'lucide-react';
import { useOrganizationDetails } from '../hooks/useOrganizationDetails';
import { useSubscriptionHistory } from '../hooks/useSubscriptionHistory';
import { SubscriptionHistoryDto } from '@gymspace/sdk';
import { format, formatDistanceToNow } from 'date-fns';

interface SubscriptionHistoryModalProps {
  organizationId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type FilterType = 'all' | 'active' | 'expired' | 'cancelled';
type SortBy = 'date_desc' | 'date_asc';

const statusColors: Record<string, string> = {
  active: 'default',
  expired: 'destructive',
  cancelled: 'secondary',
  pending: 'outline',
};

const statusIcons: Record<string, React.ReactNode> = {
  active: <CheckCircleIcon className="h-4 w-4" />,
  expired: <AlertCircleIcon className="h-4 w-4" />,
  cancelled: <XCircleIcon className="h-4 w-4" />,
  pending: <ClockIcon className="h-4 w-4" />,
};

export function SubscriptionHistoryModal({
  organizationId,
  isOpen,
  onOpenChange,
}: SubscriptionHistoryModalProps) {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('date_desc');
  const [selectedTab, setSelectedTab] = useState('timeline');

  const { data: organization, isLoading: organizationLoading } = useOrganizationDetails(organizationId);
  const { data: history, isLoading: historyLoading } = useSubscriptionHistory(organizationId, isOpen);

  const isLoading = organizationLoading || historyLoading;

  // Filter and sort history
  const processedHistory = useMemo(() => {
    if (!history) return [];

    let filtered = [...history];

    // Apply filter
    if (filterType !== 'all') {
      filtered = filtered.filter(item => {
        if (filterType === 'active') return item.isActive;
        if (filterType === 'expired') return item.status === 'expired';
        if (filterType === 'cancelled') return item.status === 'cancelled';
        return true;
      });
    }

    // Apply search
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.planName.toLowerCase().includes(search) ||
        item.createdBy.name.toLowerCase().includes(search) ||
        item.createdBy.email.toLowerCase().includes(search)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();
      return sortBy === 'date_desc' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [history, filterType, searchTerm, sortBy]);

  const handleExport = () => {
    // Placeholder for export functionality
    console.log('Exporting subscription history for organization:', organizationId);
    // In a real implementation, this would generate a CSV/PDF file
  };

  const renderTimelineItem = (item: SubscriptionHistoryDto, index: number) => {
    const isLast = index === processedHistory.length - 1;

    return (
      <div key={item.id} className="relative pb-8">
        {!isLast && (
          <span
            className="absolute left-5 top-10 -ml-px h-full w-0.5 bg-gray-200"
            aria-hidden="true"
          />
        )}
        <div className="relative flex items-start space-x-3">
          <div className="relative">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white ${
              item.isActive ? 'bg-green-500' : item.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-400'
            }`}>
              {statusIcons[item.status] || <InfoIcon className="h-5 w-5 text-white" />}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {item.planName}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant={statusColors[item.status] as any}>
                        {item.status}
                      </Badge>
                      {item.isActive && (
                        <Badge variant="outline" className="text-green-600">
                          Current Plan
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(item.startDate), 'PPP')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      to {format(new Date(item.endDate), 'PPP')}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Created by:</span>
                    <p className="font-medium">{item.createdBy.name}</p>
                    <p className="text-muted-foreground">{item.createdBy.email}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Added:</span>
                    <p className="font-medium">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {item.metadata && Object.keys(item.metadata).length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Additional Details:</p>
                    <div className="space-y-1">
                      {Object.entries(item.metadata).map(([key, value]) => (
                        <div key={key} className="text-xs">
                          <span className="text-muted-foreground">{key}: </span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  const renderListItem = (item: SubscriptionHistoryDto) => (
    <Card key={item.id} className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{item.planName}</h4>
            <Badge variant={statusColors[item.status] as any}>
              {item.status}
            </Badge>
            {item.isActive && (
              <Badge variant="outline" className="text-green-600">
                Current
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {format(new Date(item.startDate), 'MMM d, yyyy')}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Duration: </span>
            <span className="font-medium">
              {format(new Date(item.startDate), 'MMM d, yyyy')} - {format(new Date(item.endDate), 'MMM d, yyyy')}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Created by: </span>
            <span className="font-medium">{item.createdBy.name}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Added: </span>
            <span className="font-medium">
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Subscription History</DialogTitle>
          <DialogDescription>
            View the complete subscription history for {organization?.name}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 py-4 border-b">
              <div className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search plans, users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
                  <SelectTrigger className="w-[140px]">
                    <FilterIcon className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date_desc">Newest First</SelectItem>
                    <SelectItem value="date_asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <DownloadIcon className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            {/* Tabs for different views */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="timeline">Timeline View</TabsTrigger>
                <TabsTrigger value="list">List View</TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="flex-1 mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  {processedHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No subscription history found
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {processedHistory.map((item, index) => renderTimelineItem(item, index))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="list" className="flex-1 mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  {processedHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No subscription history found
                    </div>
                  ) : (
                    <div>
                      {processedHistory.map(renderListItem)}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {/* Summary Statistics */}
            {history && history.length > 0 && (
              <div className="border-t pt-4">
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-muted-foreground">Total Changes</p>
                    <p className="text-2xl font-semibold">{history.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Active Plans</p>
                    <p className="text-2xl font-semibold">
                      {history.filter(h => h.isActive).length}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Renewals</p>
                    <p className="text-2xl font-semibold">
                      {history.filter(h => h.metadata?.type === 'renewal').length}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Upgrades</p>
                    <p className="text-2xl font-semibold">
                      {history.filter(h => h.metadata?.type === 'upgrade').length}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}