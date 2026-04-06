import { gql } from '@apollo/client';

import { MATCH_FIELDS } from '../fragments/match';

export const GENERATE_MATCHES = gql`
  ${MATCH_FIELDS}
  mutation GenerateMatches($tournamentId: ID!) {
    generateMatches(tournamentId: $tournamentId) {
      ...MatchFields
    }
  }
`;

export const UPDATE_MATCH_SCHEDULE = gql`
  ${MATCH_FIELDS}
  mutation UpdateMatchSchedule($id: ID!, $input: UpdateMatchScheduleInput!) {
    updateMatchSchedule(id: $id, input: $input) {
      ...MatchFields
    }
  }
`;

export const SUBMIT_MATCH_RESULT = gql`
  ${MATCH_FIELDS}
  mutation SubmitMatchResult($id: ID!, $input: SubmitMatchResultInput!) {
    submitMatchResult(id: $id, input: $input) {
      ...MatchFields
    }
  }
`;

export const ADD_MATCH_EVENT = gql`
  mutation AddMatchEvent($matchId: ID!, $input: MatchEventInput!) {
    addMatchEvent(matchId: $matchId, input: $input) {
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
`;
