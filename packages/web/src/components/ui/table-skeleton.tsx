import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 5 }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <TableCell key={colIndex}>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                {colIndex === 1 && <Skeleton className="h-3 w-32" />}
              </div>
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}