'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';

import { ROUTES } from '@/lib/constants';
import { GET_NOTIFICATIONS, GET_UNREAD_COUNT } from '@/graphql/queries/notification';
import { MARK_AS_READ, MARK_ALL_AS_READ } from '@/graphql/mutations/notification';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { Pagination } from '@/components/shared/pagination';
import { NotificationList } from '@/components/notification/notification-list';

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const router = useRouter();
  const [offset, setOffset] = useState(0);

  const { data, loading, fetchMore, refetch } = useQuery(GET_NOTIFICATIONS, {
    variables: { limit: PAGE_SIZE, offset: 0 },
  });

  const [markAsRead] = useMutation(MARK_AS_READ, {
    refetchQueries: [{ query: GET_UNREAD_COUNT }],
  });

  const [markAllAsRead, { loading: markingAll }] = useMutation(MARK_ALL_AS_READ, {
    onCompleted: () => {
      toast.success('Đã đánh dấu tất cả thông báo đã đọc.');
      refetch();
    },
    refetchQueries: [{ query: GET_UNREAD_COUNT }],
    onError: (err) => toast.error(err.message),
  });

  const notifications = data?.notifications?.items ?? [];
  const total = data?.notifications?.total ?? 0;
  const hasMore = offset + PAGE_SIZE < total;

  async function handleItemClick(notification: {
    id: string;
    isRead: boolean;
    data?: string | null;
  }) {
    if (!notification.isRead) {
      await markAsRead({ variables: { id: notification.id } });
    }

    if (notification.data) {
      try {
        const parsed = JSON.parse(notification.data);
        if (parsed.tournamentId) {
          router.push(ROUTES.tournamentDetail(parsed.tournamentId));
          return;
        }
        if (parsed.matchId && parsed.tournamentId) {
          router.push(ROUTES.matchDetail(parsed.tournamentId, parsed.matchId));
          return;
        }
      } catch {
        // data is not valid JSON, ignore
      }
    }
  }

  function handleLoadMore() {
    const nextOffset = offset + PAGE_SIZE;
    setOffset(nextOffset);
    fetchMore({
      variables: { limit: PAGE_SIZE, offset: nextOffset },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          notifications: {
            ...fetchMoreResult.notifications,
            items: [
              ...prev.notifications.items,
              ...fetchMoreResult.notifications.items,
            ],
          },
        };
      },
    });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thông báo</h1>
          <p className="text-sm text-muted-foreground">
            Cập nhật hoạt động giải đấu.
          </p>
        </div>
        {notifications.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead()}
            disabled={markingAll}
          >
            {markingAll ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="mr-2 h-4 w-4" />
            )}
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Không có thông báo"
          description="Bạn đã xem hết! Thông báo mới sẽ hiện ở đây."
        />
      ) : (
        <>
          <NotificationList
            notifications={notifications}
            onItemClick={handleItemClick}
          />
          <Pagination hasNextPage={hasMore} onLoadMore={handleLoadMore} />
        </>
      )}
    </div>
  );
}
