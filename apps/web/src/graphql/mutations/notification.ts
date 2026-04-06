import { gql } from '@apollo/client';

export const MARK_AS_READ = gql`
  mutation MarkAsRead($id: ID!) {
    markAsRead(id: $id) {
      id
      isRead
      readAt
    }
  }
`;

export const MARK_ALL_AS_READ = gql`
  mutation MarkAllAsRead {
    markAllAsRead
  }
`;
