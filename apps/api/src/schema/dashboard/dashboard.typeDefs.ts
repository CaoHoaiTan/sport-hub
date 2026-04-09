import { gql } from 'graphql-tag';

export const dashboardTypeDefs = gql`
  scalar JSON

  type FinancialSummary {
    totalRevenue: Float!
    totalPaid: Float!
    totalPending: Float!
    totalRefunded: Float!
  }

  type OrganizerDashboard {
    activeTournaments: Int!
    totalTeams: Int!
    totalPlayers: Int!
    upcomingMatches: [Match!]!
    recentResults: [Match!]!
    financialSummary: FinancialSummary!
  }

  type AdminDashboard {
    totalUsers: Int!
    totalTournaments: Int!
    totalMatches: Int!
    recentUsers: [User!]!
  }

  type PlayerDashboard {
    activeTournaments: Int!
    upcomingMatches: [Match!]!
    totalGoals: Int!
    totalAssists: Int!
    totalMatchesPlayed: Int!
  }

  extend type Query {
    organizerDashboard: OrganizerDashboard!
    adminDashboard: AdminDashboard!
    playerDashboard: PlayerDashboard!
    exportTournamentReport(tournamentId: ID!): JSON!
    exportFinancialReport(tournamentId: ID!): JSON!
  }
`;
