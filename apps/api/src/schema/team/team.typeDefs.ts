import gql from 'graphql-tag';

export const teamTypeDefs = gql`
  type Team {
    id: ID!
    tournamentId: ID!
    tournament: Tournament!
    name: String!
    logoUrl: String
    managerId: ID!
    manager: User!
    groupName: String
    seed: Int
    players: [TeamPlayer!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input RegisterTeamInput {
    tournamentId: ID!
    name: String!
    logoUrl: String
  }

  input PlayerInput {
    fullName: String!
    jerseyNumber: Int!
    position: String
  }

  input RegisterTeamWithPlayersInput {
    tournamentId: ID!
    name: String!
    logoUrl: String
    players: [PlayerInput!]!
  }

  input UpdateTeamInput {
    name: String
    logoUrl: String
  }

  extend type Query {
    team(id: ID!): Team
    teamsByTournament(tournamentId: ID!): [Team!]!
  }

  extend type Mutation {
    registerTeam(input: RegisterTeamInput!): Team!
    registerTeamWithPlayers(input: RegisterTeamWithPlayersInput!): Team!
    updateTeam(id: ID!, input: UpdateTeamInput!): Team!
    deleteTeam(id: ID!): Boolean!
    drawGroups(tournamentId: ID!, groupCount: Int!): [Team!]!
  }
`;
