import { gql } from '@apollo/client';

export const GET_PLAYERS_BY_TEAM = gql`
  query GetPlayersByTeam($teamId: ID!) {
    playersByTeam(teamId: $teamId) {
      id
      teamId
      userId
      fullName
      jerseyNumber
      position
      isCaptain
      isActive
      createdAt
    }
  }
`;
