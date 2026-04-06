import { gql } from '@apollo/client';

export const MATCH_FIELDS = gql`
  fragment MatchFields on Match {
    id
    tournamentId
    round
    roundName
    groupName
    bracketPosition
    scheduledAt
    startedAt
    endedAt
    status
    homeScore
    awayScore
    winnerTeamId
    isDraw
    notes
    homeTeam {
      id
      name
      logoUrl
    }
    awayTeam {
      id
      name
      logoUrl
    }
    venue {
      id
      name
    }
    sets {
      id
      setNumber
      homeScore
      awayScore
    }
    createdAt
    updatedAt
  }
`;
