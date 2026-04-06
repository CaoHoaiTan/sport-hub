import type { Team } from '@sporthub/db';
import type { GraphQLContext } from '../../context.js';
import { requireAuth, requireRole } from '../../middleware/role.guard.js';
import { TeamService } from './team.service.js';
import { UserService } from '../user/user.service.js';
import { PlayerService } from '../player/player.service.js';

export const teamResolvers = {
  Query: {
    team: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      const service = new TeamService(ctx.db);
      return service.getById(id) ?? null;
    },

    teamsByTournament: async (
      _: unknown,
      { tournamentId }: { tournamentId: string },
      ctx: GraphQLContext
    ) => {
      const service = new TeamService(ctx.db);
      return service.listTeamsByTournament(tournamentId);
    },
  },

  Mutation: {
    registerTeam: async (
      _: unknown,
      { input }: { input: unknown },
      ctx: GraphQLContext
    ) => {
      const user = requireRole(ctx.user, 'team_manager', 'organizer', 'admin');
      const service = new TeamService(ctx.db);
      return service.registerTeam(user.id, input);
    },

    updateTeam: async (
      _: unknown,
      { id, input }: { id: string; input: unknown },
      ctx: GraphQLContext
    ) => {
      const user = requireAuth(ctx.user);
      const service = new TeamService(ctx.db);
      return service.updateTeam(id, user.id, user.role, input);
    },

    deleteTeam: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext
    ) => {
      const user = requireAuth(ctx.user);
      const service = new TeamService(ctx.db);
      return service.deleteTeam(id, user.id, user.role);
    },

    drawGroups: async (
      _: unknown,
      { tournamentId, groupCount }: { tournamentId: string; groupCount: number },
      ctx: GraphQLContext
    ) => {
      const user = requireRole(ctx.user, 'organizer', 'admin');
      const service = new TeamService(ctx.db);
      return service.drawGroups(tournamentId, groupCount, user.id, user.role);
    },
  },

  Team: {
    tournamentId: (t: Team) => t.tournament_id,
    tournament: async (t: Team, _: unknown, ctx: GraphQLContext) => {
      return ctx.db
        .selectFrom('tournaments')
        .selectAll()
        .where('id', '=', t.tournament_id)
        .executeTakeFirst();
    },
    logoUrl: (t: Team) => t.logo_url,
    managerId: (t: Team) => t.manager_id,
    manager: async (t: Team, _: unknown, ctx: GraphQLContext) => {
      const service = new UserService(ctx.db);
      return service.getUserById(t.manager_id);
    },
    groupName: (t: Team) => t.group_name,
    players: async (t: Team, _: unknown, ctx: GraphQLContext) => {
      const service = new PlayerService(ctx.db);
      return service.getPlayersByTeam(t.id);
    },
    createdAt: (t: Team) => t.created_at,
    updatedAt: (t: Team) => t.updated_at,
  },
};
