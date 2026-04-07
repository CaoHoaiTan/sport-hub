import { gql } from '@apollo/client';

import { TEAM_FIELDS } from '../fragments/team';

export const GET_TEAMS_BY_TOURNAMENT = gql`
  ${TEAM_FIELDS}
  query GetTeamsByTournament($tournamentId: ID!) {
    teamsByTournament(tournamentId: $tournamentId) {
      ...TeamFields
    }
  }
`;

export const GET_TEAM = gql`
  ${TEAM_FIELDS}
  query GetTeam($id: ID!) {
    team(id: $id) {
      ...TeamFields
      tournament {
        id
        sport
        entryFee
        minPlayersPerTeam
        maxPlayersPerTeam
      }
      players {
        id
        fullName
        jerseyNumber
        position
        isCaptain
        isActive
      }
    }
  }
`;
