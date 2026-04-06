import type { Match, MatchSet, MatchEvent } from '@sporthub/db';
import type { GraphQLContext } from '../../context.js';
import { requireAuth, requireRole } from '../../middleware/role.guard.js';
import { MatchService } from './match.service.js';

export const matchResolvers = {
  Query: {
    match: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      const service = new MatchService(ctx.db);
      return service.getById(id) ?? null;
    },

    matchesByTournament: async (
      _: unknown,
      { tournamentId }: { tournamentId: string },
      ctx: GraphQLContext
    ) => {
      const service = new MatchService(ctx.db);
      return service.getMatchesByTournament(tournamentId);
    },

    matchesByTeam: async (
      _: unknown,
      { teamId }: { teamId: string },
      ctx: GraphQLContext
    ) => {
      const service = new MatchService(ctx.db);
      return service.getMatchesByTeam(teamId);
    },

    upcomingMatches: async (
      _: unknown,
      { tournamentId, limit }: { tournamentId: string; limit?: number },
      ctx: GraphQLContext
    ) => {
      const service = new MatchService(ctx.db);
      return service.getUpcomingMatches(tournamentId, limit ?? 10);
    },
  },

  Mutation: {
    generateMatches: async (
      _: unknown,
      { tournamentId }: { tournamentId: string },
      ctx: GraphQLContext
    ) => {
      const user = requireRole(ctx.user, 'organizer', 'admin');
      const service = new MatchService(ctx.db);
      return service.generateMatches(tournamentId, user.id, user.role);
    },

    updateMatchSchedule: async (
      _: unknown,
      { id, input }: { id: string; input: unknown },
      ctx: GraphQLContext
    ) => {
      const user = requireAuth(ctx.user);
      const service = new MatchService(ctx.db);
      return service.updateMatchSchedule(id, user.id, user.role, input);
    },

    submitMatchResult: async (
      _: unknown,
      { id, input }: { id: string; input: unknown },
      ctx: GraphQLContext
    ) => {
      const user = requireAuth(ctx.user);
      const service = new MatchService(ctx.db);
      return service.submitMatchResult(id, user.id, user.role, input);
    },

    addMatchEvent: async (
      _: unknown,
      { matchId, input }: { matchId: string; input: unknown },
      ctx: GraphQLContext
    ) => {
      const user = requireAuth(ctx.user);
      const service = new MatchService(ctx.db);
      return service.addMatchEvent(matchId, user.id, user.role, input);
    },
  },

  Match: {
    tournamentId: (m: Match) => m.tournament_id,
    tournament: async (m: Match, _: unknown, ctx: GraphQLContext) => {
      return ctx.db
        .selectFrom('tournaments')
        .selectAll()
        .where('id', '=', m.tournament_id)
        .executeTakeFirst();
    },
    homeTeamId: (m: Match) => m.home_team_id,
    homeTeam: async (m: Match, _: unknown, ctx: GraphQLContext) => {
      if (!m.home_team_id) return null;
      return ctx.db
        .selectFrom('teams')
        .selectAll()
        .where('id', '=', m.home_team_id)
        .executeTakeFirst();
    },
    awayTeamId: (m: Match) => m.away_team_id,
    awayTeam: async (m: Match, _: unknown, ctx: GraphQLContext) => {
      if (!m.away_team_id) return null;
      return ctx.db
        .selectFrom('teams')
        .selectAll()
        .where('id', '=', m.away_team_id)
        .executeTakeFirst();
    },
    roundName: (m: Match) => m.round_name,
    groupName: (m: Match) => m.group_name,
    bracketPosition: (m: Match) => m.bracket_position,
    venueId: (m: Match) => m.venue_id,
    venue: async (m: Match, _: unknown, ctx: GraphQLContext) => {
      if (!m.venue_id) return null;
      return ctx.db
        .selectFrom('venues')
        .selectAll()
        .where('id', '=', m.venue_id)
        .executeTakeFirst();
    },
    scheduledAt: (m: Match) => m.scheduled_at,
    startedAt: (m: Match) => m.started_at,
    endedAt: (m: Match) => m.ended_at,
    refereeId: (m: Match) => m.referee_id,
    homeScore: (m: Match) => m.home_score,
    awayScore: (m: Match) => m.away_score,
    winnerTeamId: (m: Match) => m.winner_team_id,
    isDraw: (m: Match) => m.is_draw,
    postponedReason: (m: Match) => m.postponed_reason,
    checkinOpensAt: (m: Match) => m.checkin_opens_at,
    checkinDeadline: (m: Match) => m.checkin_deadline,
    sets: async (m: Match, _: unknown, ctx: GraphQLContext) => {
      return ctx.db
        .selectFrom('match_sets')
        .selectAll()
        .where('match_id', '=', m.id)
        .orderBy('set_number', 'asc')
        .execute();
    },
    events: async (m: Match, _: unknown, ctx: GraphQLContext) => {
      return ctx.db
        .selectFrom('match_events')
        .selectAll()
        .where('match_id', '=', m.id)
        .orderBy('created_at', 'asc')
        .execute();
    },
    createdAt: (m: Match) => m.created_at,
    updatedAt: (m: Match) => m.updated_at,
  },

  MatchSet: {
    matchId: (s: MatchSet) => s.match_id,
    setNumber: (s: MatchSet) => s.set_number,
    homeScore: (s: MatchSet) => s.home_score,
    awayScore: (s: MatchSet) => s.away_score,
  },

  MatchEvent: {
    matchId: (e: MatchEvent) => e.match_id,
    teamId: (e: MatchEvent) => e.team_id,
    playerId: (e: MatchEvent) => e.player_id,
    eventType: (e: MatchEvent) => e.event_type,
    setNumber: (e: MatchEvent) => e.set_number,
    createdAt: (e: MatchEvent) => e.created_at,
  },
};
