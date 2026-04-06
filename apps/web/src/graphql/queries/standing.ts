import { gql } from '@apollo/client';

export const GET_STANDINGS = gql`
  query GetStandings($tournamentId: ID!, $groupName: String) {
    standingsByTournament(tournamentId: $tournamentId, groupName: $groupName) {
      id
      tournamentId
      teamId
      team {
        id
        name
        logoUrl
      }
      groupName
      played
      won
      drawn
      lost
      goalsFor
      goalsAgainst
      goalDifference
      points
      setsWon
      setsLost
      rank
      updatedAt
    }
  }
`;

export const GET_PLAYER_STATISTICS = gql`
  query GetPlayerStatistics($tournamentId: ID!, $teamId: ID) {
    playerStatistics(tournamentId: $tournamentId, teamId: $teamId) {
      id
      tournamentId
      playerId
      player {
        id
        fullName
        jerseyNumber
        position
      }
      teamId
      team {
        id
        name
      }
      goals
      assists
      yellowCards
      redCards
      pointsScored
      aces
      matchesPlayed
      mvpCount
      updatedAt
    }
  }
`;
