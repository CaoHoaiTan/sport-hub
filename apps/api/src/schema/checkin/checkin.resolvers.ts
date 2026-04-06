import type { MatchCheckin } from '@sporthub/db';
import type { GraphQLContext } from '../../context.js';
import { requireAuth, requireRole } from '../../middleware/role.guard.js';
import { CheckinService } from './checkin.service.js';

export const checkinResolvers = {
  Query: {
    matchCheckinStatus: async (
      _: unknown,
      { matchId }: { matchId: string },
      ctx: GraphQLContext
    ) => {
      const service = new CheckinService(ctx.db);
      return service.getCheckinStatus(matchId);
    },
  },

  Mutation: {
    openCheckin: async (
      _: unknown,
      { matchId }: { matchId: string },
      ctx: GraphQLContext
    ) => {
      const user = requireRole(ctx.user, 'organizer', 'admin', 'referee');
      const service = new CheckinService(ctx.db);
      return service.openCheckin(matchId, user.id, user.role);
    },

    playerCheckin: async (
      _: unknown,
      { matchId, playerId }: { matchId: string; playerId: string },
      ctx: GraphQLContext
    ) => {
      const user = requireAuth(ctx.user);
      const service = new CheckinService(ctx.db);
      return service.playerCheckin(matchId, playerId, user.id, user.role);
    },

    qrCheckin: async (
      _: unknown,
      { code, playerId }: { code: string; playerId: string },
      ctx: GraphQLContext
    ) => {
      const service = new CheckinService(ctx.db);
      return service.qrCheckin(code, playerId);
    },

    closeCheckin: async (
      _: unknown,
      { matchId }: { matchId: string },
      ctx: GraphQLContext
    ) => {
      const user = requireRole(ctx.user, 'organizer', 'admin', 'referee');
      const service = new CheckinService(ctx.db);
      return service.closeCheckin(matchId, user.id, user.role);
    },

    setLineup: async (
      _: unknown,
      { input }: { input: unknown },
      ctx: GraphQLContext
    ) => {
      const user = requireRole(ctx.user, 'organizer', 'admin', 'team_manager');
      const service = new CheckinService(ctx.db);
      return service.setLineup(input, user.id, user.role);
    },
  },

  MatchCheckin: {
    matchId: (c: MatchCheckin) => c.match_id,
    match: async (c: MatchCheckin, _: unknown, ctx: GraphQLContext) => {
      return ctx.db
        .selectFrom('matches')
        .selectAll()
        .where('id', '=', c.match_id)
        .executeTakeFirst();
    },
    teamId: (c: MatchCheckin) => c.team_id,
    team: async (c: MatchCheckin, _: unknown, ctx: GraphQLContext) => {
      return ctx.db
        .selectFrom('teams')
        .selectAll()
        .where('id', '=', c.team_id)
        .executeTakeFirst();
    },
    playerId: (c: MatchCheckin) => c.player_id,
    checkedInAt: (c: MatchCheckin) => c.checked_in_at,
    checkedInBy: (c: MatchCheckin) => c.checked_in_by,
    isStarting: (c: MatchCheckin) => c.is_starting,
    createdAt: (c: MatchCheckin) => c.created_at,
  },
};
