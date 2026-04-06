'use client';

import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from './empty-state';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  keyExtractor?: (row: T) => string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No data found',
  emptyDescription = 'There are no items to display.',
  keyExtractor,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border py-4">
        <EmptyState
          icon={Inbox}
          title={emptyMessage}
          description={emptyDescription}
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className={col.className}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => {
            const key = keyExtractor
              ? keyExtractor(row)
              : (row.id as string) ?? String(index);
            return (
              <TableRow key={key}>
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render
                      ? col.render(row)
                      : (row[col.key] as ReactNode) ?? '-'}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
