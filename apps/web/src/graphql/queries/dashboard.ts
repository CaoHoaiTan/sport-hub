import { gql } from '@apollo/client';

import { MATCH_FIELDS } from '../fragments/match';
import { USER_FIELDS } from '../fragments/user';

export const GET_ORGANIZER_DASHBOARD = gql`
  ${MATCH_FIELDS}
  query GetOrganizerDashboard {
    organizerDashboard {
      activeTournaments
      totalTeams
      totalPlayers
      upcomingMatches {
        ...MatchFields
      }
      recentResults {
        ...MatchFields
      }
      financialSummary {
        totalRevenue
        totalPaid
        totalPending
        totalRefunded
      }
    }
  }
`;

export const GET_ADMIN_DASHBOARD = gql`
  ${MATCH_FIELDS}
  ${USER_FIELDS}
  query GetAdminDashboard {
    adminDashboard {
      totalUsers
      totalTournaments
      totalMatches
      recentUsers {
        ...UserFields
      }
    }
  }
`;

export const GET_PLAYER_DASHBOARD = gql`
  ${MATCH_FIELDS}
  query GetPlayerDashboard {
    playerDashboard {
      activeTournaments
      upcomingMatches {
        ...MatchFields
      }
      totalGoals
      totalAssists
      totalMatchesPlayed
    }
  }
`;
