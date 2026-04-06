import { gql } from '@apollo/client';

import { TEAM_FIELDS } from '../fragments/team';

export const REGISTER_TEAM = gql`
  ${TEAM_FIELDS}
  mutation RegisterTeam($input: RegisterTeamInput!) {
    registerTeam(input: $input) {
      ...TeamFields
    }
  }
`;

export const UPDATE_TEAM = gql`
  ${TEAM_FIELDS}
  mutation UpdateTeam($id: ID!, $input: UpdateTeamInput!) {
    updateTeam(id: $id, input: $input) {
      ...TeamFields
    }
  }
`;

export const DELETE_TEAM = gql`
  mutation DeleteTeam($id: ID!) {
    deleteTeam(id: $id)
  }
`;

export const DRAW_GROUPS = gql`
  ${TEAM_FIELDS}
  mutation DrawGroups($tournamentId: ID!, $groupCount: Int!) {
    drawGroups(tournamentId: $tournamentId, groupCount: $groupCount) {
      ...TeamFields
    }
  }
`;
