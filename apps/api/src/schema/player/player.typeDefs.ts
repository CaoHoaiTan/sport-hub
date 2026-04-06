import gql from 'graphql-tag';

export const playerTypeDefs = gql`
  type TeamPlayer {
    id: ID!
    teamId: ID!
    team: Team!
    userId: ID
    fullName: String!
    jerseyNumber: Int!
    position: String
    isCaptain: Boolean!
    isActive: Boolean!
    createdAt: DateTime!
  }

  input AddPlayerInput {
    teamId: ID!
    userId: ID
    fullName: String!
    jerseyNumber: Int!
    position: String
  }

  input UpdatePlayerInput {
    fullName: String
    jerseyNumber: Int
    position: String
    isActive: Boolean
  }

  extend type Query {
    playersByTeam(teamId: ID!): [TeamPlayer!]!
  }

  extend type Mutation {
    addPlayer(input: AddPlayerInput!): TeamPlayer!
    removePlayer(id: ID!): Boolean!
    updatePlayer(id: ID!, input: UpdatePlayerInput!): TeamPlayer!
    setCaptain(teamId: ID!, playerId: ID!): TeamPlayer!
  }
`;
