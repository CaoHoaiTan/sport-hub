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
