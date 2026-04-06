import type { Standing, PlayerStatistic } from '@sporthub/db';
import type { GraphQLContext } from '../../context.js';
import { StandingService } from './standing.service.js';

export const standingResolvers = {
  Query: {
    standingsByTournament: async (
      _: unknown,
      { tournamentId, groupName }: { tournamentId: string; groupName?: string },
      ctx: GraphQLContext
    ) => {
      const service = new StandingService(ctx.db);
      return service.getStandingsByTournament(tournamentId, groupName);
    },

    playerStatistics: async (
      _: unknown,
      { tournamentId, teamId }: { tournamentId: string; teamId?: string },
      ctx: GraphQLContext
    ) => {
      const service = new StandingService(ctx.db);
      return service.getPlayerStatistics(tournamentId, teamId);
    },
  },

  Standing: {
    tournamentId: (s: Standing) => s.tournament_id,
    teamId: (s: Standing) => s.team_id,
    team: async (s: Standing, _: unknown, ctx: GraphQLContext) => {
      return ctx.db
        .selectFrom('teams')
        .selectAll()
        .where('id', '=', s.team_id)
        .executeTakeFirst();
    },
    groupName: (s: Standing) => s.group_name,
    goalsFor: (s: Standing) => s.goals_for,
    goalsAgainst: (s: Standing) => s.goals_against,
    goalDifference: (s: Standing) => s.goal_difference,
    setsWon: (s: Standing) => s.sets_won,
    setsLost: (s: Standing) => s.sets_lost,
    updatedAt: (s: Standing) => s.updated_at,
  },

  PlayerStatistic: {
    tournamentId: (ps: PlayerStatistic) => ps.tournament_id,
    playerId: (ps: PlayerStatistic) => ps.player_id,
    player: async (ps: PlayerStatistic, _: unknown, ctx: GraphQLContext) => {
      return ctx.db
        .selectFrom('team_players')
        .selectAll()
        .where('id', '=', ps.player_id)
        .executeTakeFirst();
    },
    teamId: (ps: PlayerStatistic) => ps.team_id,
    team: async (ps: PlayerStatistic, _: unknown, ctx: GraphQLContext) => {
      return ctx.db
        .selectFrom('teams')
        .selectAll()
        .where('id', '=', ps.team_id)
        .executeTakeFirst();
    },
    yellowCards: (ps: PlayerStatistic) => ps.yellow_cards,
    redCards: (ps: PlayerStatistic) => ps.red_cards,
    pointsScored: (ps: PlayerStatistic) => ps.points_scored,
    matchesPlayed: (ps: PlayerStatistic) => ps.matches_played,
    mvpCount: (ps: PlayerStatistic) => ps.mvp_count,
    updatedAt: (ps: PlayerStatistic) => ps.updated_at,
  },
};
