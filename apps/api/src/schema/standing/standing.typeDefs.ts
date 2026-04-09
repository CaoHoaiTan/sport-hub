import { gql } from 'graphql-tag';

export const standingTypeDefs = gql`
  type Standing {
    id: ID!
    tournamentId: ID!
    teamId: ID!
    team: Team!
    groupName: String
    played: Int!
    won: Int!
    drawn: Int!
    lost: Int!
    goalsFor: Int!
    goalsAgainst: Int!
    goalDifference: Int!
    points: Int!
    setsWon: Int!
    setsLost: Int!
    rank: Int
    updatedAt: DateTime!
  }

  type PlayerStatistic {
    id: ID!
    tournamentId: ID!
    playerId: ID!
    player: TeamPlayer!
    teamId: ID!
    team: Team!
    goals: Int!
    assists: Int!
    yellowCards: Int!
    redCards: Int!
    pointsScored: Int!
    aces: Int!
    matchesPlayed: Int!
    mvpCount: Int!
    updatedAt: DateTime!
  }

  extend type Query {
    standingsByTournament(tournamentId: ID!, groupName: String): [Standing!]!
    playerStatistics(tournamentId: ID!, teamId: ID): [PlayerStatistic!]!
  }
`;
