import { GraphQLError } from 'graphql';
import type { Notification } from '@sporthub/db';
import type { GraphQLContext } from '../../context.js';
import { requireAuth } from '../../middleware/role.guard.js';
import { NotificationService } from './notification.service.js';
import { pubsub, EVENTS } from '../../lib/pubsub.js';

export const notificationResolvers = {
  Query: {
    notifications: async (
      _: unknown,
      { limit, offset }: { limit?: number; offset?: number },
      ctx: GraphQLContext
    ) => {
      const user = requireAuth(ctx.user);
      const service = new NotificationService(ctx.db);
      return service.getNotifications(user.id, limit ?? 20, offset ?? 0);
    },

    unreadCount: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const user = requireAuth(ctx.user);
      const service = new NotificationService(ctx.db);
      return service.getUnreadCount(user.id);
    },
  },

  Mutation: {
    markAsRead: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext
    ) => {
      const user = requireAuth(ctx.user);
      const service = new NotificationService(ctx.db);
      return service.markAsRead(id, user.id);
    },

    markAllAsRead: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const user = requireAuth(ctx.user);
      const service = new NotificationService(ctx.db);
      return service.markAllAsRead(user.id);
    },
  },

  Subscription: {
    notificationReceived: {
      subscribe: (_: unknown, { userId }: { userId: string }, ctx: GraphQLContext) => {
        const user = requireAuth(ctx.user);
        if (user.id !== userId && user.role !== 'admin') {
          throw new GraphQLError('Forbidden', {
            extensions: { code: 'FORBIDDEN' },
          });
        }
        return pubsub.asyncIterableIterator(`${EVENTS.NOTIFICATION_RECEIVED}.${userId}`);
      },
      resolve: (payload: { notificationReceived: Notification }) => {
        return payload.notificationReceived;
      },
    },
  },

  Notification: {
    userId: (n: Notification) => n.user_id,
    isRead: (n: Notification) => n.is_read,
    readAt: (n: Notification) => n.read_at,
    sentEmail: (n: Notification) => n.sent_email,
    sentPush: (n: Notification) => n.sent_push,
    data: (n: Notification) => (n.data ? JSON.stringify(n.data) : null),
    createdAt: (n: Notification) => n.created_at,
  },
};
