import { gql } from '@apollo/client';

export const TEAM_FIELDS = gql`
  fragment TeamFields on Team {
    id
    tournamentId
    name
    logoUrl
    managerId
    groupName
    seed
    manager {
      id
      fullName
    }
    createdAt
    updatedAt
  }
`;
