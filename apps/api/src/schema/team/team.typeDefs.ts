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
    updateTeam(id: ID!, input: UpdateTeamInput!): Team!
    deleteTeam(id: ID!): Boolean!
    drawGroups(tournamentId: ID!, groupCount: Int!): [Team!]!
  }
`;
