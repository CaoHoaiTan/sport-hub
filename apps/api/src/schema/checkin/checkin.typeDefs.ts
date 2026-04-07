import gql from 'graphql-tag';

export const checkinTypeDefs = gql`
  enum CheckinStatus {
    pending
    checked_in
    absent
  }

  type MatchCheckin {
    id: ID!
    matchId: ID!
    match: Match!
    teamId: ID!
    team: Team!
    playerId: ID!
    status: CheckinStatus!
    checkedInAt: DateTime
    method: String
    checkedInBy: ID
    isStarting: Boolean!
    createdAt: DateTime!
  }

  type CheckinQrCode {
    id: ID!
    matchId: ID!
    code: String!
    qrDataUrl: String!
    expiresAt: DateTime!
    isUsed: Boolean!
    createdAt: DateTime!
  }

  type CheckinStatusResponse {
    matchId: ID!
    checkins: [MatchCheckin!]!
    qrCode: CheckinQrCode
    isOpen: Boolean!
  }

  input SetLineupInput {
    matchId: ID!
    teamId: ID!
    startingPlayerIds: [ID!]!
  }

  type QrCheckinInfo {
    matchId: ID!
    homeTeam: Team
    awayTeam: Team
    homePlayers: [TeamPlayer!]!
    awayPlayers: [TeamPlayer!]!
    isOpen: Boolean!
  }

  extend type Query {
    matchCheckinStatus(matchId: ID!): CheckinStatusResponse!
    checkinInfoByCode(code: String!): QrCheckinInfo!
  }

  extend type Mutation {
    openCheckin(matchId: ID!): CheckinStatusResponse!
    playerCheckin(matchId: ID!, playerId: ID!): MatchCheckin!
    qrCheckin(code: String!, playerId: ID!): MatchCheckin!
    closeCheckin(matchId: ID!): CheckinStatusResponse!
    setLineup(input: SetLineupInput!): [MatchCheckin!]!
  }
`;
