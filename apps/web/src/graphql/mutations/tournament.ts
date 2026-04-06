import { gql } from '@apollo/client';

import { TOURNAMENT_FIELDS } from '../fragments/tournament';

export const CREATE_TOURNAMENT = gql`
  ${TOURNAMENT_FIELDS}
  mutation CreateTournament($input: CreateTournamentInput!) {
    createTournament(input: $input) {
      ...TournamentFields
    }
  }
`;

export const UPDATE_TOURNAMENT = gql`
  ${TOURNAMENT_FIELDS}
  mutation UpdateTournament($id: ID!, $input: UpdateTournamentInput!) {
    updateTournament(id: $id, input: $input) {
      ...TournamentFields
    }
  }
`;

export const DELETE_TOURNAMENT = gql`
  mutation DeleteTournament($id: ID!) {
    deleteTournament(id: $id)
  }
`;

export const UPDATE_TOURNAMENT_STATUS = gql`
  ${TOURNAMENT_FIELDS}
  mutation UpdateTournamentStatus($id: ID!, $status: TournamentStatus!) {
    updateTournamentStatus(id: $id, status: $status) {
      ...TournamentFields
    }
  }
`;
