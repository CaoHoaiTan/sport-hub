'use client';

import { NotificationItem } from './notification-item';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  data?: string | null;
  createdAt: string;
}

interface NotificationListProps {
  notifications: Notification[];
  onItemClick?: (notification: Notification) => void;
}

export function NotificationList({
  notifications,
  onItemClick,
}: NotificationListProps) {
  return (
    <div className="space-y-2">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClick={onItemClick}
        />
      ))}
    </div>
  );
}
