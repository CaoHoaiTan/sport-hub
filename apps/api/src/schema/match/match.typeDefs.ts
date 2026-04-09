import { gql } from 'graphql-tag';

export const matchTypeDefs = gql`
  enum MatchStatus {
    scheduled
    checkin_open
    live
    completed
    postponed
    cancelled
  }

  type Match {
    id: ID!
    tournamentId: ID!
    tournament: Tournament!
    homeTeamId: ID
    homeTeam: Team
    awayTeamId: ID
    awayTeam: Team
    round: Int!
    roundName: String
    groupName: String
    bracketPosition: Int
    venueId: ID
    venue: Venue
    scheduledAt: DateTime
    startedAt: DateTime
    endedAt: DateTime
    status: MatchStatus!
    refereeId: ID
    homeScore: Int
    awayScore: Int
    winnerTeamId: ID
    isDraw: Boolean
    notes: String
    postponedReason: String
    checkinOpensAt: DateTime
    checkinDeadline: DateTime
    sets: [MatchSet!]!
    events: [MatchEvent!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type MatchSet {
    id: ID!
    matchId: ID!
    setNumber: Int!
    homeScore: Int!
    awayScore: Int!
  }

  type MatchEvent {
    id: ID!
    matchId: ID!
    teamId: ID
    playerId: ID
    eventType: String!
    minute: Int
    setNumber: Int
    description: String
    createdAt: DateTime!
  }

  input UpdateMatchScheduleInput {
    venueId: ID
    scheduledAt: DateTime
    refereeId: ID
  }

  input SubmitMatchResultInput {
    homeScore: Int!
    awayScore: Int!
    sets: [MatchSetInput!]
    events: [MatchEventInput!]
  }

  input MatchSetInput {
    setNumber: Int!
    homeScore: Int!
    awayScore: Int!
  }

  input MatchEventInput {
    teamId: ID!
    playerId: ID
    eventType: String!
    minute: Int
    setNumber: Int
    description: String
  }

  extend type Query {
    match(id: ID!): Match
    matchesByTournament(tournamentId: ID!): [Match!]!
    matchesByTeam(teamId: ID!): [Match!]!
    upcomingMatches(tournamentId: ID!, limit: Int): [Match!]!
  }

  extend type Mutation {
    generateMatches(tournamentId: ID!): [Match!]!
    updateMatchSchedule(id: ID!, input: UpdateMatchScheduleInput!): Match!
    submitMatchResult(id: ID!, input: SubmitMatchResultInput!): Match!
    addMatchEvent(matchId: ID!, input: MatchEventInput!): MatchEvent!
  }
`;
