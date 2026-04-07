import { gql } from '@apollo/client';

import { USER_FIELDS } from '../fragments/user';

export const GET_USERS = gql`
  ${USER_FIELDS}
  query GetUsers($pagination: PaginationInput) {
    users(pagination: $pagination) {
      edges {
        cursor
        node {
          ...UserFields
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

export const SEARCH_USERS = gql`
  query SearchUsers($query: String!, $limit: Int) {
    searchUsers(query: $query, limit: $limit) {
      id
      email
      fullName
    }
  }
`;
