import { gql } from '@apollo/client';

import { TOURNAMENT_FIELDS } from '../fragments/tournament';
import { MATCH_FIELDS } from '../fragments/match';

export const GET_PUBLIC_TOURNAMENT = gql`
  ${TOURNAMENT_FIELDS}
  query GetPublicTournament($slug: String!) {
    publicTournament(slug: $slug) {
      ...TournamentFields
    }
  }
`;

export const GET_PUBLIC_STANDINGS = gql`
  query GetPublicStandings($tournamentSlug: String!) {
    publicStandings(tournamentSlug: $tournamentSlug) {
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

export const GET_PUBLIC_SCHEDULE = gql`
  ${MATCH_FIELDS}
  query GetPublicSchedule($tournamentSlug: String!) {
    publicSchedule(tournamentSlug: $tournamentSlug) {
      ...MatchFields
    }
  }
`;

export const GET_PUBLIC_MATCH = gql`
  ${MATCH_FIELDS}
  query GetPublicMatch($id: ID!) {
    publicMatch(id: $id) {
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

export const GET_TOURNAMENT_POSTS = gql`
  query GetTournamentPosts($tournamentId: ID!, $limit: Int, $offset: Int) {
    tournamentPosts(tournamentId: $tournamentId, limit: $limit, offset: $offset) {
      id
      tournamentId
      authorId
      author {
        id
        fullName
        avatarUrl
      }
      title
      content
      mediaUrls
      isPinned
      createdAt
      updatedAt
    }
  }
`;

export const GET_MATCH_COMMENTS = gql`
  query GetMatchComments($matchId: ID!, $limit: Int, $offset: Int) {
    matchComments(matchId: $matchId, limit: $limit, offset: $offset) {
      id
      matchId
      userId
      user {
        id
        fullName
        avatarUrl
      }
      guestName
      content
      parentId
      replies {
        id
        userId
        user {
          id
          fullName
          avatarUrl
        }
        guestName
        content
        createdAt
      }
      createdAt
    }
  }
`;

export const GET_MATCH_REACTION_COUNTS = gql`
  query GetMatchReactionCounts($matchId: ID!) {
    matchReactionCounts(matchId: $matchId) {
      reaction
      count
    }
  }
`;
