import { GraphQLError } from 'graphql';
import type { MatchCheckin, CheckinQrCode } from '@sporthub/db';
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

    checkinInfoByCode: async (
      _: unknown,
      { code }: { code: string },
      ctx: GraphQLContext
    ) => {
      const service = new CheckinService(ctx.db);
      return service.getCheckinInfoByCode(code);
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
      const user = requireAuth(ctx.user);
      // Verify the player belongs to this user
      const player = await ctx.db
        .selectFrom('team_players')
        .select(['id', 'user_id'])
        .where('id', '=', playerId)
        .executeTakeFirst();
      if (!player || player.user_id !== user.id) {
        throw new GraphQLError(
          'Bạn chỉ có thể check-in cho chính mình',
          { extensions: { code: 'FORBIDDEN' } }
        );
      }
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

  CheckinQrCode: {
    matchId: (q: CheckinQrCode) => q.match_id,
    expiresAt: (q: CheckinQrCode) => q.expires_at,
    isUsed: (q: CheckinQrCode) => q.is_used,
    createdAt: (q: CheckinQrCode) => q.created_at,
    qrDataUrl: (q: CheckinQrCode & { qrDataUrl?: string }) => q.qrDataUrl ?? null,
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
