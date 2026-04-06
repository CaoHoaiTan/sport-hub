import { gql } from '@apollo/client';

export const GET_NOTIFICATIONS = gql`
  query GetNotifications($limit: Int, $offset: Int) {
    notifications(limit: $limit, offset: $offset) {
      items {
        id
        userId
        type
        title
        body
        data
        isRead
        readAt
        createdAt
      }
      total
    }
  }
`;

export const GET_UNREAD_COUNT = gql`
  query GetUnreadCount {
    unreadCount
  }
`;
