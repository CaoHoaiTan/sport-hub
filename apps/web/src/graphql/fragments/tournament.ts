import { gql } from '@apollo/client';

export const TOURNAMENT_FIELDS = gql`
  fragment TournamentFields on Tournament {
    id
    name
    slug
    description
    sport
    format
    status
    maxTeams
    minPlayersPerTeam
    maxPlayersPerTeam
    groupCount
    teamsPerGroupAdvance
    registrationStart
    registrationEnd
    startDate
    endDate
    pointsForWin
    pointsForDraw
    pointsForLoss
    entryFee
    currency
    bannerUrl
    rulesText
    createdAt
    updatedAt
    organizer {
      id
      fullName
      avatarUrl
    }
  }
`;
