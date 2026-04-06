import { gql } from '@apollo/client';

import { MATCH_FIELDS } from '../fragments/match';

export const GET_MATCHES_BY_TOURNAMENT = gql`
  ${MATCH_FIELDS}
  query GetMatchesByTournament($tournamentId: ID!) {
    matchesByTournament(tournamentId: $tournamentId) {
      ...MatchFields
    }
  }
`;

export const GET_MATCH = gql`
  ${MATCH_FIELDS}
  query GetMatch($id: ID!) {
    match(id: $id) {
      ...MatchFields
      events {
        id
        matchId
        teamId
        playerId
        eventType
        minute
        setNumber
        description
        createdAt
      }
    }
  }
`;

export const GET_UPCOMING_MATCHES = gql`
  ${MATCH_FIELDS}
  query GetUpcomingMatches($tournamentId: ID!, $limit: Int) {
    upcomingMatches(tournamentId: $tournamentId, limit: $limit) {
      ...MatchFields
    }
  }
`;

export const GET_MATCHES_BY_TEAM = gql`
  ${MATCH_FIELDS}
  query GetMatchesByTeam($teamId: ID!) {
    matchesByTeam(teamId: $teamId) {
      ...MatchFields
    }
  }
`;
