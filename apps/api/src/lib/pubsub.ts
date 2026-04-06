import { PubSub } from 'graphql-subscriptions';

/**
 * In-memory PubSub for GraphQL subscriptions.
 * Replace with Redis PubSub for production multi-instance deployments.
 */
export const pubsub = new PubSub();

export const EVENTS = {
  NOTIFICATION_RECEIVED: 'NOTIFICATION_RECEIVED',
} as const;
