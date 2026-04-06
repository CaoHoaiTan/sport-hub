import gql from 'graphql-tag';
import { authTypeDefs } from './auth/auth.typeDefs.js';
import { authResolvers } from './auth/auth.resolvers.js';
import { userTypeDefs } from './user/user.typeDefs.js';
import { userResolvers } from './user/user.resolvers.js';
import { tournamentTypeDefs } from './tournament/tournament.typeDefs.js';
import { tournamentResolvers } from './tournament/tournament.resolvers.js';
import { teamTypeDefs } from './team/team.typeDefs.js';
import { teamResolvers } from './team/team.resolvers.js';
import { playerTypeDefs } from './player/player.typeDefs.js';
import { playerResolvers } from './player/player.resolvers.js';
import { venueTypeDefs } from './venue/venue.typeDefs.js';
import { venueResolvers } from './venue/venue.resolvers.js';
import { matchTypeDefs } from './match/match.typeDefs.js';
import { matchResolvers } from './match/match.resolvers.js';
import { standingTypeDefs } from './standing/standing.typeDefs.js';
import { standingResolvers } from './standing/standing.resolvers.js';
import { checkinTypeDefs } from './checkin/checkin.typeDefs.js';
import { checkinResolvers } from './checkin/checkin.resolvers.js';
import { paymentTypeDefs } from './payment/payment.typeDefs.js';
import { paymentResolvers } from './payment/payment.resolvers.js';
import { notificationTypeDefs } from './notification/notification.typeDefs.js';
import { notificationResolvers } from './notification/notification.resolvers.js';
import { publicTypeDefs } from './public/public.typeDefs.js';
import { publicResolvers } from './public/public.resolvers.js';
import { dashboardTypeDefs } from './dashboard/dashboard.typeDefs.js';
import { dashboardResolvers } from './dashboard/dashboard.resolvers.js';

const baseTypeDefs = gql`
  scalar DateTime

  type Query {
    health: String!
  }

  type Mutation {
    _empty: String
  }

  type Subscription {
    _empty: String
  }
`;

const baseResolvers = {
  Query: {
    health: () => 'OK',
  },
};

export const typeDefs = [
  baseTypeDefs,
  userTypeDefs,
  authTypeDefs,
  tournamentTypeDefs,
  teamTypeDefs,
  playerTypeDefs,
  venueTypeDefs,
  matchTypeDefs,
  standingTypeDefs,
  checkinTypeDefs,
  paymentTypeDefs,
  notificationTypeDefs,
  publicTypeDefs,
  dashboardTypeDefs,
];

export const resolvers = [
  baseResolvers,
  userResolvers,
  authResolvers,
  tournamentResolvers,
  teamResolvers,
  playerResolvers,
  venueResolvers,
  matchResolvers,
  standingResolvers,
  checkinResolvers,
  paymentResolvers,
  notificationResolvers,
  publicResolvers,
  dashboardResolvers,
];
