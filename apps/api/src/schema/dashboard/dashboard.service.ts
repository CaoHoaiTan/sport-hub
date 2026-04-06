import { GraphQLError } from 'graphql';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { Database, User, Match } from '@sporthub/db';

// ─── Types ───────────────────────────────────────────────
interface FinancialSummary {
  totalRevenue: number;
  totalPaid: number;
  totalPending: number;
  totalRefunded: number;
}

interface OrganizerDashboardResult {
  activeTournaments: number;
  totalTeams: number;
  totalPlayers: number;
  upcomingMatches: Match[];
  recentResults: Match[];
  financialSummary: FinancialSummary;
}

interface AdminDashboardResult {
  totalUsers: number;
  totalTournaments: number;
  totalMatches: number;
  recentUsers: User[];
}

interface PlayerDashboardResult {
  activeTournaments: number;
  upcomingMatches: Match[];
  totalGoals: number;
  totalAssists: number;
  totalMatchesPlayed: number;
}

// ─── Service ─────────────────────────────────────────────
export class DashboardService {
  constructor(private db: Kysely<Database>) {}

  async getOrganizerDashboard(organizerId: string): Promise<OrganizerDashboardResult> {
    const activeTournamentsResult = await this.db
      .selectFrom('tournaments')
      .select(sql<number>`count(*)::int`.as('count'))
      .where('organizer_id', '=', organizerId)
      .where('status', 'in', ['registration', 'in_progress'])
      .executeTakeFirstOrThrow();

    const totalTeamsResult = await this.db
      .selectFrom('teams')
      .innerJoin('tournaments', 'tournaments.id', 'teams.tournament_id')
      .select(sql<number>`count(teams.id)::int`.as('count'))
      .where('tournaments.organizer_id', '=', organizerId)
      .executeTakeFirstOrThrow();

    const totalPlayersResult = await this.db
      .selectFrom('team_players')
      .innerJoin('teams', 'teams.id', 'team_players.team_id')
      .innerJoin('tournaments', 'tournaments.id', 'teams.tournament_id')
      .select(sql<number>`count(team_players.id)::int`.as('count'))
      .where('tournaments.organizer_id', '=', organizerId)
      .executeTakeFirstOrThrow();

    const upcomingMatches = await this.db
      .selectFrom('matches')
      .innerJoin('tournaments', 'tournaments.id', 'matches.tournament_id')
      .selectAll('matches')
      .where('tournaments.organizer_id', '=', organizerId)
      .where('matches.status', 'in', ['scheduled', 'checkin_open'])
      .where('matches.scheduled_at', '>', new Date())
      .orderBy('matches.scheduled_at', 'asc')
      .limit(10)
      .execute();

    const recentResults = await this.db
      .selectFrom('matches')
      .innerJoin('tournaments', 'tournaments.id', 'matches.tournament_id')
      .selectAll('matches')
      .where('tournaments.organizer_id', '=', organizerId)
      .where('matches.status', '=', 'completed')
      .orderBy('matches.ended_at', 'desc')
      .limit(10)
      .execute();

    const financialSummary = await this.getFinancialSummaryForOrganizer(organizerId);

    return {
      activeTournaments: activeTournamentsResult.count,
      totalTeams: totalTeamsResult.count,
      totalPlayers: totalPlayersResult.count,
      upcomingMatches,
      recentResults,
      financialSummary,
    };
  }

  async getAdminDashboard(): Promise<AdminDashboardResult> {
    const totalUsersResult = await this.db
      .selectFrom('users')
      .select(sql<number>`count(*)::int`.as('count'))
      .executeTakeFirstOrThrow();

    const totalTournamentsResult = await this.db
      .selectFrom('tournaments')
      .select(sql<number>`count(*)::int`.as('count'))
      .executeTakeFirstOrThrow();

    const totalMatchesResult = await this.db
      .selectFrom('matches')
      .select(sql<number>`count(*)::int`.as('count'))
      .executeTakeFirstOrThrow();

    const recentUsers = await this.db
      .selectFrom('users')
      .selectAll()
      .orderBy('created_at', 'desc')
      .limit(10)
      .execute();

    return {
      totalUsers: totalUsersResult.count,
      totalTournaments: totalTournamentsResult.count,
      totalMatches: totalMatchesResult.count,
      recentUsers,
    };
  }

  async getPlayerDashboard(userId: string): Promise<PlayerDashboardResult> {
    // Count active tournaments where user is a player
    const activeTournamentsResult = await this.db
      .selectFrom('team_players')
      .innerJoin('teams', 'teams.id', 'team_players.team_id')
      .innerJoin('tournaments', 'tournaments.id', 'teams.tournament_id')
      .select(sql<number>`count(distinct tournaments.id)::int`.as('count'))
      .where('team_players.user_id', '=', userId)
      .where('tournaments.status', 'in', ['registration', 'in_progress'])
      .executeTakeFirstOrThrow();

    // Upcoming matches for teams the player belongs to
    const playerTeamIds = await this.db
      .selectFrom('team_players')
      .select('team_id')
      .where('user_id', '=', userId)
      .where('is_active', '=', true)
      .execute();

    const teamIds = playerTeamIds.map((t) => t.team_id);

    let upcomingMatches: Match[] = [];
    if (teamIds.length > 0) {
      upcomingMatches = await this.db
        .selectFrom('matches')
        .selectAll()
        .where((eb) =>
          eb.or([
            eb('home_team_id', 'in', teamIds),
            eb('away_team_id', 'in', teamIds),
          ])
        )
        .where('status', 'in', ['scheduled', 'checkin_open'])
        .where('scheduled_at', '>', new Date())
        .orderBy('scheduled_at', 'asc')
        .limit(10)
        .execute();
    }

    // Aggregate player statistics
    const statsResult = await this.db
      .selectFrom('player_statistics')
      .innerJoin('team_players', 'team_players.id', 'player_statistics.player_id')
      .select([
        sql<number>`coalesce(sum(player_statistics.goals), 0)::int`.as('totalGoals'),
        sql<number>`coalesce(sum(player_statistics.assists), 0)::int`.as('totalAssists'),
        sql<number>`coalesce(sum(player_statistics.matches_played), 0)::int`.as('totalMatchesPlayed'),
      ])
      .where('team_players.user_id', '=', userId)
      .executeTakeFirstOrThrow();

    return {
      activeTournaments: activeTournamentsResult.count,
      upcomingMatches,
      totalGoals: statsResult.totalGoals,
      totalAssists: statsResult.totalAssists,
      totalMatchesPlayed: statsResult.totalMatchesPlayed,
    };
  }

  async exportTournamentReport(tournamentId: string, organizerId: string): Promise<Record<string, unknown>> {
    // Verify ownership
    const tournament = await this.db
      .selectFrom('tournaments')
      .selectAll()
      .where('id', '=', tournamentId)
      .executeTakeFirst();

    if (!tournament) {
      throw new GraphQLError('Tournament not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    if (tournament.organizer_id !== organizerId) {
      throw new GraphQLError('Not authorized to export this tournament', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    // Standings
    const standings = await this.db
      .selectFrom('standings')
      .innerJoin('teams', 'teams.id', 'standings.team_id')
      .selectAll('standings')
      .select('teams.name as team_name')
      .where('standings.tournament_id', '=', tournamentId)
      .orderBy('standings.rank', 'asc')
      .execute();

    // Top scorers
    const topScorers = await this.db
      .selectFrom('player_statistics')
      .innerJoin('team_players', 'team_players.id', 'player_statistics.player_id')
      .innerJoin('teams', 'teams.id', 'player_statistics.team_id')
      .select([
        'team_players.full_name as player_name',
        'teams.name as team_name',
        'player_statistics.goals',
        'player_statistics.assists',
        'player_statistics.matches_played',
      ])
      .where('player_statistics.tournament_id', '=', tournamentId)
      .orderBy('player_statistics.goals', 'desc')
      .limit(20)
      .execute();

    // Match results
    const matchResults = await this.db
      .selectFrom('matches')
      .leftJoin('teams as home', 'home.id', 'matches.home_team_id')
      .leftJoin('teams as away', 'away.id', 'matches.away_team_id')
      .select([
        'matches.id',
        'matches.round',
        'matches.round_name',
        'matches.group_name',
        'matches.scheduled_at',
        'matches.status',
        'matches.home_score',
        'matches.away_score',
        'home.name as home_team_name',
        'away.name as away_team_name',
      ])
      .where('matches.tournament_id', '=', tournamentId)
      .orderBy('matches.round', 'asc')
      .orderBy('matches.bracket_position', 'asc')
      .execute();

    // Team stats
    const teamStats = await this.db
      .selectFrom('teams')
      .leftJoin('standings', (join) =>
        join
          .onRef('standings.team_id', '=', 'teams.id')
          .on('standings.tournament_id', '=', tournamentId)
      )
      .select([
        'teams.id',
        'teams.name',
        'standings.played',
        'standings.won',
        'standings.drawn',
        'standings.lost',
        'standings.goals_for',
        'standings.goals_against',
        'standings.goal_difference',
        'standings.points',
        'standings.rank',
      ])
      .where('teams.tournament_id', '=', tournamentId)
      .orderBy('standings.rank', 'asc')
      .execute();

    return {
      tournament: {
        id: tournament.id,
        name: tournament.name,
        sport: tournament.sport,
        format: tournament.format,
        status: tournament.status,
        startDate: tournament.start_date,
        endDate: tournament.end_date,
      },
      standings,
      topScorers,
      matchResults,
      teamStats,
      exportedAt: new Date().toISOString(),
    };
  }

  async exportFinancialReport(tournamentId: string, organizerId: string): Promise<Record<string, unknown>> {
    const tournament = await this.db
      .selectFrom('tournaments')
      .selectAll()
      .where('id', '=', tournamentId)
      .executeTakeFirst();

    if (!tournament) {
      throw new GraphQLError('Tournament not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    if (tournament.organizer_id !== organizerId) {
      throw new GraphQLError('Not authorized to export this tournament', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    // Per-team payment details
    const teamPayments = await this.db
      .selectFrom('payments')
      .innerJoin('teams', 'teams.id', 'payments.team_id')
      .innerJoin('payment_plans', 'payment_plans.id', 'payments.payment_plan_id')
      .select([
        'teams.name as team_name',
        'payments.amount',
        'payments.currency',
        'payments.status',
        'payments.method',
        'payments.paid_at',
        'payments.created_at',
        'payment_plans.name as plan_name',
      ])
      .where('payment_plans.tournament_id', '=', tournamentId)
      .orderBy('teams.name', 'asc')
      .execute();

    // Summary by method
    const summaryByMethod = await this.db
      .selectFrom('payments')
      .innerJoin('payment_plans', 'payment_plans.id', 'payments.payment_plan_id')
      .select([
        'payments.method',
        sql<number>`count(*)::int`.as('count'),
        sql<number>`coalesce(sum(payments.amount::numeric), 0)`.as('total'),
      ])
      .where('payment_plans.tournament_id', '=', tournamentId)
      .where('payments.status', '=', 'paid')
      .groupBy('payments.method')
      .execute();

    // Overall summary
    const overallSummary = await this.getFinancialSummaryForTournament(tournamentId);

    return {
      tournament: {
        id: tournament.id,
        name: tournament.name,
        currency: tournament.currency,
      },
      teamPayments,
      summaryByMethod,
      overallSummary,
      exportedAt: new Date().toISOString(),
    };
  }

  // ─── Helpers ─────────────────────────────────────────────
  private async getFinancialSummaryForOrganizer(organizerId: string): Promise<FinancialSummary> {
    const result = await this.db
      .selectFrom('payments')
      .innerJoin('payment_plans', 'payment_plans.id', 'payments.payment_plan_id')
      .innerJoin('tournaments', 'tournaments.id', 'payment_plans.tournament_id')
      .select([
        sql<number>`coalesce(sum(payments.amount::numeric), 0)`.as('totalRevenue'),
        sql<number>`coalesce(sum(case when payments.status = 'paid' then payments.amount::numeric else 0 end), 0)`.as('totalPaid'),
        sql<number>`coalesce(sum(case when payments.status = 'pending' then payments.amount::numeric else 0 end), 0)`.as('totalPending'),
        sql<number>`coalesce(sum(case when payments.status = 'refunded' then payments.amount::numeric else 0 end), 0)`.as('totalRefunded'),
      ])
      .where('tournaments.organizer_id', '=', organizerId)
      .executeTakeFirstOrThrow();

    return {
      totalRevenue: Number(result.totalRevenue),
      totalPaid: Number(result.totalPaid),
      totalPending: Number(result.totalPending),
      totalRefunded: Number(result.totalRefunded),
    };
  }

  private async getFinancialSummaryForTournament(tournamentId: string): Promise<FinancialSummary> {
    const result = await this.db
      .selectFrom('payments')
      .innerJoin('payment_plans', 'payment_plans.id', 'payments.payment_plan_id')
      .select([
        sql<number>`coalesce(sum(payments.amount::numeric), 0)`.as('totalRevenue'),
        sql<number>`coalesce(sum(case when payments.status = 'paid' then payments.amount::numeric else 0 end), 0)`.as('totalPaid'),
        sql<number>`coalesce(sum(case when payments.status = 'pending' then payments.amount::numeric else 0 end), 0)`.as('totalPending'),
        sql<number>`coalesce(sum(case when payments.status = 'refunded' then payments.amount::numeric else 0 end), 0)`.as('totalRefunded'),
      ])
      .where('payment_plans.tournament_id', '=', tournamentId)
      .executeTakeFirstOrThrow();

    return {
      totalRevenue: Number(result.totalRevenue),
      totalPaid: Number(result.totalPaid),
      totalPending: Number(result.totalPending),
      totalRefunded: Number(result.totalRefunded),
    };
  }
}
