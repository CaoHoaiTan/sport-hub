'use client';

import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface PaginationProps {
  hasNextPage: boolean;
  hasPreviousPage?: boolean;
  onLoadMore: () => void;
  isLoading?: boolean;
}

export function Pagination({
  hasNextPage,
  onLoadMore,
  isLoading = false,
}: PaginationProps) {
  if (!hasNextPage) {
    return null;
  }

  return (
    <div className="flex justify-center py-4">
      <Button
        variant="outline"
        onClick={onLoadMore}
        disabled={isLoading}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? 'Đang tải...' : 'Xem thêm'}
      </Button>
    </div>
  );
}
