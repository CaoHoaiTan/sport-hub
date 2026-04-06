import type { Tournament } from '@sporthub/db';
import type { GraphQLContext } from '../../context.js';
import { requireAuth, requireRole } from '../../middleware/role.guard.js';
import { TournamentService } from './tournament.service.js';
import { UserService } from '../user/user.service.js';

export const tournamentResolvers = {
  Query: {
    tournament: async (
      _: unknown,
      { id, slug }: { id?: string; slug?: string },
      ctx: GraphQLContext
    ) => {
      const service = new TournamentService(ctx.db);
      return service.getByIdOrSlug(id, slug);
    },

    tournaments: async (
      _: unknown,
      { filter, pagination }: { filter?: Record<string, string>; pagination?: { first?: number; after?: string } },
      ctx: GraphQLContext
    ) => {
      const service = new TournamentService(ctx.db);
      return service.list(filter, pagination);
    },

    myTournaments: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const user = requireRole(ctx.user, 'organizer', 'admin');
      const service = new TournamentService(ctx.db);
      return service.getByOrganizer(user.id);
    },
  },

  Mutation: {
    createTournament: async (
      _: unknown,
      { input }: { input: unknown },
      ctx: GraphQLContext
    ) => {
      const user = requireRole(ctx.user, 'organizer', 'admin');
      const service = new TournamentService(ctx.db);
      return service.create(user.id, input);
    },

    updateTournament: async (
      _: unknown,
      { id, input }: { id: string; input: unknown },
      ctx: GraphQLContext
    ) => {
      const user = requireAuth(ctx.user);
      const service = new TournamentService(ctx.db);
      return service.update(id, user.id, user.role, input);
    },

    deleteTournament: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext
    ) => {
      const user = requireAuth(ctx.user);
      const service = new TournamentService(ctx.db);
      return service.delete(id, user.id, user.role);
    },

    updateTournamentStatus: async (
      _: unknown,
      { id, status }: { id: string; status: string },
      ctx: GraphQLContext
    ) => {
      const user = requireAuth(ctx.user);
      const service = new TournamentService(ctx.db);
      return service.updateStatus(id, status as never, user.id, user.role);
    },
  },

  Tournament: {
    organizer: async (tournament: Tournament, _: unknown, ctx: GraphQLContext) => {
      const service = new UserService(ctx.db);
      return service.getUserById(tournament.organizer_id);
    },
    maxTeams: (t: Tournament) => t.max_teams,
    minPlayersPerTeam: (t: Tournament) => t.min_players_per_team,
    maxPlayersPerTeam: (t: Tournament) => t.max_players_per_team,
    groupCount: (t: Tournament) => t.group_count,
    teamsPerGroupAdvance: (t: Tournament) => t.teams_per_group_advance,
    registrationStart: (t: Tournament) => t.registration_start,
    registrationEnd: (t: Tournament) => t.registration_end,
    startDate: (t: Tournament) => t.start_date,
    endDate: (t: Tournament) => t.end_date,
    pointsForWin: (t: Tournament) => t.points_for_win,
    pointsForDraw: (t: Tournament) => t.points_for_draw,
    pointsForLoss: (t: Tournament) => t.points_for_loss,
    entryFee: (t: Tournament) => t.entry_fee ? parseFloat(String(t.entry_fee)) : null,
    bannerUrl: (t: Tournament) => t.banner_url,
    rulesText: (t: Tournament) => t.rules_text,
    createdAt: (t: Tournament) => t.created_at,
    updatedAt: (t: Tournament) => t.updated_at,
  },
};
