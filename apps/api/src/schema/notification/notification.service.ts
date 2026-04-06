import { GraphQLError } from 'graphql';
import type { Kysely } from 'kysely';
import type { Database, Notification, NotificationTypeType } from '@sporthub/db';
import { pubsub, EVENTS } from '../../lib/pubsub.js';
import { sendEmail } from '../../lib/email.js';

interface CreateNotificationParams {
  userId: string;
  type: NotificationTypeType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sendEmailFlag?: boolean;
}

export class NotificationService {
  constructor(private db: Kysely<Database>) {}

  async createNotification(params: CreateNotificationParams): Promise<Notification> {
    const notification = await this.db
      .insertInto('notifications')
      .values({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        data: params.data ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Publish for subscriptions
    pubsub.publish(EVENTS.NOTIFICATION_RECEIVED, {
      notificationReceived: notification,
    });

    // Queue email if requested
    if (params.sendEmailFlag) {
      const user = await this.db
        .selectFrom('users')
        .select(['email'])
        .where('id', '=', params.userId)
        .executeTakeFirst();

      if (user) {
        await sendEmail({
          to: user.email,
          subject: params.title,
          html: `<div style="font-family: sans-serif;"><h2>${params.title}</h2><p>${params.body}</p></div>`,
        });

        await this.db
          .updateTable('notifications')
          .set({ sent_email: true })
          .where('id', '=', notification.id)
          .execute();
      }
    }

    return notification;
  }

  async createBulkNotification(
    userIds: string[],
    type: NotificationTypeType,
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<Notification[]> {
    if (userIds.length === 0) return [];

    const values = userIds.map((userId) => ({
      user_id: userId,
      type,
      title,
      body,
      data: data ?? null,
    }));

    const notifications = await this.db
      .insertInto('notifications')
      .values(values)
      .returningAll()
      .execute();

    // Publish for each user
    for (const notification of notifications) {
      pubsub.publish(EVENTS.NOTIFICATION_RECEIVED, {
        notificationReceived: notification,
      });
    }

    return notifications;
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.db
      .selectFrom('notifications')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!notification) {
      throw new GraphQLError('Notification not found', { extensions: { code: 'NOT_FOUND' } });
    }

    if (notification.user_id !== userId) {
      throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } });
    }

    return this.db
      .updateTable('notifications')
      .set({ is_read: true, read_at: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    await this.db
      .updateTable('notifications')
      .set({ is_read: true, read_at: new Date() })
      .where('user_id', '=', userId)
      .where('is_read', '=', false)
      .execute();

    return true;
  }

  async getNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ items: Notification[]; total: number }> {
    const safeLimit = Math.min(limit, 100);

    const [items, countResult] = await Promise.all([
      this.db
        .selectFrom('notifications')
        .selectAll()
        .where('user_id', '=', userId)
        .orderBy('created_at', 'desc')
        .limit(safeLimit)
        .offset(offset)
        .execute(),
      this.db
        .selectFrom('notifications')
        .select((eb) => eb.fn.countAll<number>().as('count'))
        .where('user_id', '=', userId)
        .executeTakeFirstOrThrow(),
    ]);

    return { items, total: Number(countResult.count) };
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await this.db
      .selectFrom('notifications')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('user_id', '=', userId)
      .where('is_read', '=', false)
      .executeTakeFirstOrThrow();

    return Number(result.count);
  }
}
