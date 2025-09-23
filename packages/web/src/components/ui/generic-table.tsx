import React, { ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  accessor?: (item: T) => ReactNode;
  sortable?: boolean;
  width?: string;
  className?: string;
}

export interface SortConfig {
  key: string | null;
  direction: 'asc' | 'desc';
}

interface GenericTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  sortConfig?: SortConfig;
  onSort?: (key: string) => void;
  loading?: boolean;
  error?: Error | null;
  emptyState?: ReactNode;
  errorState?: ReactNode;
  loadingState?: ReactNode;
  actions?: (item: T) => ReactNode;
  onRowClick?: (item: T) => void;
  className?: string;
  rowClassName?: string;
}

export function GenericTable<T>({
  data,
  columns,
  keyExtractor,
  sortConfig,
  onSort,
  loading = false,
  error = null,
  emptyState,
  errorState,
  loadingState,
  actions,
  onRowClick,
  className,
  rowClassName,
}: GenericTableProps<T>) {
  const renderSortIcon = (column: Column<T>) => {
    if (!column.sortable || !sortConfig) return null;
    
    if (sortConfig.key !== column.key) {
      return <ArrowUpIcon className="size-3 opacity-30" />;
    }
    
    return sortConfig.direction === 'asc' ? (
      <ArrowUpIcon className="size-3" />
    ) : (
      <ArrowDownIcon className="size-3" />
    );
  };

  const handleHeaderClick = (column: Column<T>) => {
    if (column.sortable && onSort) {
      onSort(column.key);
    }
  };

  const renderTableContent = () => {
    if (loading && loadingState) {
      return (
        <TableRow>
          <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="p-0">
            {loadingState}
          </TableCell>
        </TableRow>
      );
    }

    if (error && errorState) {
      return (
        <TableRow>
          <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="p-0">
            {errorState}
          </TableCell>
        </TableRow>
      );
    }

    if (data.length === 0 && emptyState) {
      return (
        <TableRow>
          <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="p-0">
            {emptyState}
          </TableCell>
        </TableRow>
      );
    }

    return data.map((item) => (
      <TableRow
        key={keyExtractor(item)}
        className={`${onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''} ${rowClassName || ''}`}
        onClick={() => onRowClick?.(item)}
      >
        {columns.map((column) => (
          <TableCell key={column.key} className={column.className}>
            {column.accessor ? column.accessor(item) : (item as any)[column.key]}
          </TableCell>
        ))}
        {actions && (
          <TableCell className="w-[50px]">
            {actions(item)}
          </TableCell>
        )}
      </TableRow>
    ));
  };

  return (
    <div className={`rounded-lg border bg-white ${className || ''}`}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={`${column.sortable ? 'cursor-pointer select-none' : ''} ${column.width || ''}`}
                onClick={() => handleHeaderClick(column)}
              >
                <div className="flex items-center gap-1">
                  {column.header}
                  {renderSortIcon(column)}
                </div>
              </TableHead>
            ))}
            {actions && (
              <TableHead className="w-[50px]">Acciones</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {renderTableContent()}
        </TableBody>
      </Table>
    </div>
  );
}