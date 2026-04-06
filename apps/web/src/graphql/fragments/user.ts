import { gql } from '@apollo/client';

export const USER_FIELDS = gql`
  fragment UserFields on User {
    id
    email
    fullName
    phone
    avatarUrl
    role
    isActive
    emailVerified
    createdAt
    updatedAt
  }
`;
