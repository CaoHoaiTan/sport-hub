import { gql } from '@apollo/client';

import { USER_FIELDS } from '../fragments/user';

export const UPDATE_PROFILE = gql`
  ${USER_FIELDS}
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      ...UserFields
    }
  }
`;

export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input)
  }
`;

export const UPDATE_USER_ROLE = gql`
  ${USER_FIELDS}
  mutation UpdateUserRole($userId: ID!, $role: UserRole!) {
    updateUserRole(userId: $userId, role: $role) {
      ...UserFields
    }
  }
`;

export const TOGGLE_USER_ACTIVE = gql`
  ${USER_FIELDS}
  mutation ToggleUserActive($userId: ID!) {
    toggleUserActive(userId: $userId) {
      ...UserFields
    }
  }
`;
