import gql from 'graphql-tag';

export const userTypeDefs = gql`
  enum UserRole {
    admin
    organizer
    team_manager
    player
    referee
  }

  type User {
    id: ID!
    email: String!
    fullName: String!
    phone: String
    avatarUrl: String
    role: UserRole!
    isActive: Boolean!
    emailVerified: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input UpdateProfileInput {
    fullName: String
    phone: String
    avatarUrl: String
  }

  input ChangePasswordInput {
    currentPassword: String!
    newPassword: String!
  }

  type UserConnection {
    edges: [UserEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type UserEdge {
    cursor: String!
    node: User!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  input PaginationInput {
    first: Int
    after: String
  }

  extend type Query {
    me: User
    user(id: ID!): User
    users(pagination: PaginationInput): UserConnection!
  }

  extend type Mutation {
    updateProfile(input: UpdateProfileInput!): User!
    changePassword(input: ChangePasswordInput!): Boolean!
  }
`;
