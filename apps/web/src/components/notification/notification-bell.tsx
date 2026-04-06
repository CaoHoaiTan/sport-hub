'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useSubscription } from '@apollo/client';
import { Bell } from 'lucide-react';

import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/auth/context';
import { ROUTES } from '@/lib/constants';
import { GET_UNREAD_COUNT } from '@/graphql/queries/notification';
import { NOTIFICATION_RECEIVED } from '@/graphql/subscriptions/notification';
import { Button } from '@/components/ui/button';

export function NotificationBell() {
  const router = useRouter();
  const { user } = useAuth();

  const { data, refetch } = useQuery(GET_UNREAD_COUNT, {
    skip: !user,
  });

  useSubscription(NOTIFICATION_RECEIVED, {
    variables: { userId: user?.id },
    skip: !user?.id,
    onData: () => refetch(),
  });

  const count = data?.unreadCount ?? 0;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="relative h-9 w-9 p-0"
      onClick={() => router.push(ROUTES.notifications)}
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span
          className={cn(
            'absolute -right-0.5 -top-0.5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold',
            count > 9 ? 'h-5 w-5' : 'h-4 w-4'
          )}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Button>
  );
}
