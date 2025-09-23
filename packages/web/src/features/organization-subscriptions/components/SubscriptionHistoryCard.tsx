'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  HistoryIcon,
  ArrowRightIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  RefreshCwIcon,
  TrendingUpIcon
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface SubscriptionHistoryCardProps {
  organizationId: string;
  onViewFullHistory: () => void;
}

// Mock history data - this would come from the API
const mockHistory = [
  {
    id: '1',
    action: 'Plan Upgraded',
    from: 'Basic Plan',
    to: 'Professional Plan',
    date: new Date('2024-01-15'),
    icon: TrendingUpIcon,
    color: 'text-blue-600'
  },
  {
    id: '2',
    action: 'Subscription Renewed',
    from: null,
    to: 'Professional Plan',
    date: new Date('2023-12-01'),
    icon: RefreshCwIcon,
    color: 'text-green-600'
  },
  {
    id: '3',
    action: 'Plan Started',
    from: null,
    to: 'Basic Plan',
    date: new Date('2023-06-01'),
    icon: CheckCircleIcon,
    color: 'text-green-600'
  }
];

export function SubscriptionHistoryCard({
  organizationId,
  onViewFullHistory
}: SubscriptionHistoryCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HistoryIcon className="size-5 text-primary" />
            Recent Subscription History
          </div>
          <Button variant="ghost" size="sm" onClick={onViewFullHistory}>
            View All
            <ArrowRightIcon className="size-3 ml-1" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {mockHistory.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">No subscription history available</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

            {/* Timeline items */}
            <div className="space-y-4">
              {mockHistory.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.id} className="relative flex items-start gap-4">
                    {/* Timeline dot */}
                    <div className="relative z-10 flex size-8 items-center justify-center rounded-full bg-background border-2 border-border">
                      <Icon className={`size-4 ${item.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{item.action}</p>
                          {item.from && item.to && (
                            <p className="text-xs text-muted-foreground">
                              {item.from} → {item.to}
                            </p>
                          )}
                          {!item.from && item.to && (
                            <p className="text-xs text-muted-foreground">{item.to}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarIcon className="size-3" />
                          {formatDate(item.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="border-t pt-4 mt-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-lg font-semibold">2</p>
              <p className="text-xs text-muted-foreground">Renewals</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">1</p>
              <p className="text-xs text-muted-foreground">Upgrades</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">18</p>
              <p className="text-xs text-muted-foreground">Months Active</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}