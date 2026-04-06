import { gql } from '@apollo/client';

export const GET_MATCH_CHECKIN_STATUS = gql`
  query GetMatchCheckinStatus($matchId: ID!) {
    matchCheckinStatus(matchId: $matchId) {
      matchId
      isOpen
      qrCode {
        id
        matchId
        code
        qrDataUrl
        expiresAt
        isUsed
        createdAt
      }
      checkins {
        id
        matchId
        teamId
        team {
          id
          name
        }
        playerId
        status
        checkedInAt
        method
        checkedInBy
        isStarting
        createdAt
      }
    }
  }
`;
