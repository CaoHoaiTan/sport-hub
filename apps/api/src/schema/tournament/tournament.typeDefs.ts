import { gql } from 'graphql-tag';

export const tournamentTypeDefs = gql`
  enum SportType {
    football
    volleyball
    badminton
  }

  enum TournamentFormat {
    round_robin
    single_elimination
    double_elimination
    group_stage_knockout
  }

  enum TournamentStatus {
    draft
    registration
    in_progress
    completed
    cancelled
  }

  type Tournament {
    id: ID!
    name: String!
    slug: String!
    description: String
    sport: SportType!
    format: TournamentFormat!
    status: TournamentStatus!
    organizer: User!
    maxTeams: Int
    minPlayersPerTeam: Int!
    maxPlayersPerTeam: Int!
    groupCount: Int
    teamsPerGroupAdvance: Int
    registrationStart: DateTime
    registrationEnd: DateTime
    startDate: DateTime!
    endDate: DateTime
    pointsForWin: Int!
    pointsForDraw: Int!
    pointsForLoss: Int!
    entryFee: Float
    currency: String
    bannerUrl: String
    rulesText: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input TournamentFilter {
    sport: SportType
    status: TournamentStatus
    organizerId: ID
    search: String
  }

  type TournamentConnection {
    edges: [TournamentEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type TournamentEdge {
    cursor: String!
    node: Tournament!
  }

  input CreateTournamentInput {
    name: String!
    description: String
    sport: SportType!
    format: TournamentFormat!
    maxTeams: Int
    minPlayersPerTeam: Int!
    maxPlayersPerTeam: Int!
    groupCount: Int
    teamsPerGroupAdvance: Int
    registrationStart: DateTime
    registrationEnd: DateTime
    startDate: DateTime!
    endDate: DateTime
    pointsForWin: Int
    pointsForDraw: Int
    pointsForLoss: Int
    entryFee: Float
    currency: String
    bannerUrl: String
    rulesText: String
  }

  input UpdateTournamentInput {
    name: String
    description: String
    maxTeams: Int
    registrationStart: DateTime
    registrationEnd: DateTime
    startDate: DateTime
    endDate: DateTime
    pointsForWin: Int
    pointsForDraw: Int
    pointsForLoss: Int
    entryFee: Float
    bannerUrl: String
    rulesText: String
  }

  extend type Query {
    tournament(id: ID, slug: String): Tournament
    tournaments(filter: TournamentFilter, pagination: PaginationInput): TournamentConnection!
    myTournaments: [Tournament!]!
  }

  extend type Mutation {
    createTournament(input: CreateTournamentInput!): Tournament!
    updateTournament(id: ID!, input: UpdateTournamentInput!): Tournament!
    deleteTournament(id: ID!): Boolean!
    updateTournamentStatus(id: ID!, status: TournamentStatus!): Tournament!
  }
`;
