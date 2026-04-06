import { gql } from '@apollo/client';

import { USER_FIELDS } from '../fragments/user';

export const LOGIN = gql`
  ${USER_FIELDS}
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      user {
        ...UserFields
      }
    }
  }
`;

export const REGISTER = gql`
  ${USER_FIELDS}
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      refreshToken
      user {
        ...UserFields
      }
    }
  }
`;

export const REFRESH_TOKEN = gql`
  ${USER_FIELDS}
  mutation RefreshToken($token: String!) {
    refreshToken(token: $token) {
      accessToken
      refreshToken
      user {
        ...UserFields
      }
    }
  }
`;

export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

export const FORGOT_PASSWORD = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email)
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input)
  }
`;
