import { gql } from '@apollo/client';

export const OPEN_CHECKIN = gql`
  mutation OpenCheckin($matchId: ID!) {
    openCheckin(matchId: $matchId) {
      matchId
      isOpen
      qrCode {
        id
        code
        qrDataUrl
        expiresAt
      }
      checkins {
        id
        playerId
        status
      }
    }
  }
`;

export const PLAYER_CHECKIN = gql`
  mutation PlayerCheckin($matchId: ID!, $playerId: ID!) {
    playerCheckin(matchId: $matchId, playerId: $playerId) {
      id
      matchId
      teamId
      playerId
      status
      checkedInAt
      method
      isStarting
    }
  }
`;

export const QR_CHECKIN = gql`
  mutation QrCheckin($code: String!, $playerId: ID!) {
    qrCheckin(code: $code, playerId: $playerId) {
      id
      matchId
      teamId
      playerId
      status
      checkedInAt
      method
      isStarting
    }
  }
`;

export const CLOSE_CHECKIN = gql`
  mutation CloseCheckin($matchId: ID!) {
    closeCheckin(matchId: $matchId) {
      matchId
      isOpen
      checkins {
        id
        playerId
        status
        isStarting
      }
    }
  }
`;

export const SET_LINEUP = gql`
  mutation SetLineup($input: SetLineupInput!) {
    setLineup(input: $input) {
      id
      playerId
      status
      isStarting
    }
  }
`;
