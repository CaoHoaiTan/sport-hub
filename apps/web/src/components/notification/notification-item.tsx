import {
  Trophy,
  Users,
  Calendar,
  CreditCard,
  Bell,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils/cn';
import { formatRelativeTime } from '@/lib/utils/format';

interface NotificationData {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  data?: string | null;
  createdAt: string;
}

interface NotificationItemProps {
  notification: NotificationData;
  onClick?: (notification: NotificationData) => void;
}

const typeIcons: Record<string, LucideIcon> = {
  tournament: Trophy,
  team: Users,
  match: Calendar,
  payment: CreditCard,
};

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const Icon = typeIcons[notification.type] ?? Bell;

  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50',
        !notification.isRead && 'bg-primary/5 border-primary/20'
      )}
      onClick={() => onClick?.(notification)}
    >
      <div
        className={cn(
          'mt-0.5 rounded-lg p-2 shrink-0',
          notification.isRead ? 'bg-muted' : 'bg-primary/10'
        )}
      >
        <Icon
          className={cn(
            'h-4 w-4',
            notification.isRead ? 'text-muted-foreground' : 'text-primary'
          )}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              'text-sm truncate',
              !notification.isRead && 'font-semibold'
            )}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {notification.body}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
    </button>
  );
}
