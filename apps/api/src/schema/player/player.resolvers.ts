import type { TeamPlayer } from '@sporthub/db';
import type { GraphQLContext } from '../../context.js';
import { requireAuth } from '../../middleware/role.guard.js';
import { PlayerService } from './player.service.js';

export const playerResolvers = {
  Query: {
    playersByTeam: async (
      _: unknown,
      { teamId }: { teamId: string },
      ctx: GraphQLContext
    ) => {
      const service = new PlayerService(ctx.db);
      return service.getPlayersByTeam(teamId);
    },
  },

  Mutation: {
    addPlayer: async (
      _: unknown,
      { input }: { input: unknown },
      ctx: GraphQLContext
    ) => {
      const user = requireAuth(ctx.user);
      const service = new PlayerService(ctx.db);
      return service.addPlayer(user.id, user.role, input);
    },

    removePlayer: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext
    ) => {
      const user = requireAuth(ctx.user);
      const service = new PlayerService(ctx.db);
      return service.removePlayer(id, user.id, user.role);
    },

    updatePlayer: async (
      _: unknown,
      { id, input }: { id: string; input: unknown },
      ctx: GraphQLContext
    ) => {
      const user = requireAuth(ctx.user);
      const service = new PlayerService(ctx.db);
      return service.updatePlayer(id, user.id, user.role, input);
    },

    setCaptain: async (
      _: unknown,
      { teamId, playerId }: { teamId: string; playerId: string },
      ctx: GraphQLContext
    ) => {
      const user = requireAuth(ctx.user);
      const service = new PlayerService(ctx.db);
      return service.setCaptain(teamId, playerId, user.id, user.role);
    },
  },

  TeamPlayer: {
    teamId: (p: TeamPlayer) => p.team_id,
    team: async (p: TeamPlayer, _: unknown, ctx: GraphQLContext) => {
      return ctx.db
        .selectFrom('teams')
        .selectAll()
        .where('id', '=', p.team_id)
        .executeTakeFirst();
    },
    userId: (p: TeamPlayer) => p.user_id,
    fullName: (p: TeamPlayer) => p.full_name,
    jerseyNumber: (p: TeamPlayer) => p.jersey_number,
    isCaptain: (p: TeamPlayer) => p.is_captain,
    isActive: (p: TeamPlayer) => p.is_active,
    createdAt: (p: TeamPlayer) => p.created_at,
  },
};
