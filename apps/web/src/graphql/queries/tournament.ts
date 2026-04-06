import { gql } from '@apollo/client';

import { TOURNAMENT_FIELDS } from '../fragments/tournament';

export const GET_TOURNAMENTS = gql`
  ${TOURNAMENT_FIELDS}
  query GetTournaments($filter: TournamentFilter, $pagination: PaginationInput) {
    tournaments(filter: $filter, pagination: $pagination) {
      edges {
        cursor
        node {
          ...TournamentFields
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

export const GET_TOURNAMENT = gql`
  ${TOURNAMENT_FIELDS}
  query GetTournament($id: ID!) {
    tournament(id: $id) {
      ...TournamentFields
    }
  }
`;

export const GET_MY_TOURNAMENTS = gql`
  ${TOURNAMENT_FIELDS}
  query GetMyTournaments {
    myTournaments {
      ...TournamentFields
    }
  }
`;
