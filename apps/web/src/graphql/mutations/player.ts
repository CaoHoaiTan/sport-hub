import { gql } from '@apollo/client';

export const ADD_PLAYER = gql`
  mutation AddPlayer($input: AddPlayerInput!) {
    addPlayer(input: $input) {
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

export const UPDATE_PLAYER = gql`
  mutation UpdatePlayer($id: ID!, $input: UpdatePlayerInput!) {
    updatePlayer(id: $id, input: $input) {
      id
      userId
      fullName
      jerseyNumber
      position
      isActive
    }
  }
`;

export const REMOVE_PLAYER = gql`
  mutation RemovePlayer($id: ID!) {
    removePlayer(id: $id)
  }
`;

export const SET_CAPTAIN = gql`
  mutation SetCaptain($teamId: ID!, $playerId: ID!) {
    setCaptain(teamId: $teamId, playerId: $playerId) {
      id
      isCaptain
    }
  }
`;
