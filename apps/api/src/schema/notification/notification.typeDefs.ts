import { gql } from 'graphql-tag';

export const notificationTypeDefs = gql`
  enum NotificationType {
    match_reminder
    match_result
    schedule_change
    payment_reminder
    registration
    checkin
    announcement
    system
  }

  type Notification {
    id: ID!
    userId: ID!
    type: NotificationType!
    title: String!
    body: String!
    data: String
    isRead: Boolean!
    readAt: DateTime
    sentEmail: Boolean!
    sentPush: Boolean!
    createdAt: DateTime!
  }

  type NotificationPage {
    items: [Notification!]!
    total: Int!
  }

  extend type Query {
    notifications(limit: Int, offset: Int): NotificationPage!
    unreadCount: Int!
  }

  extend type Mutation {
    markAsRead(id: ID!): Notification!
    markAllAsRead: Boolean!
  }

  extend type Subscription {
    notificationReceived(userId: ID!): Notification!
  }
`;
