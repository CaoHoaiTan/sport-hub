import { GraphQLError } from 'graphql';
import { z } from 'zod';
import type { Kysely } from 'kysely';
import type { Database, Match, MatchEvent } from '@sporthub/db';
import {
  generateRoundRobin,
  generateSingleElimination,
  generateDoubleElimination,
  generateGroupStageKnockout,
  SPORT_RULES,
} from '@sporthub/shared';
import type { SportType as SharedSportType } from '@sporthub/shared';

const updateScheduleSchema = z.object({
  venueId: z.string().uuid().nullable().optional(),
  scheduledAt: z.coerce.date().nullable().optional(),
  refereeId: z.string().uuid().nullable().optional(),
});

const matchSetInputSchema = z.object({
  setNumber: z.number().int().min(1),
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
});

const matchEventInputSchema = z.object({
  teamId: z.string().uuid(),
  playerId: z.string().uuid().nullable().optional(),
  eventType: z.string().min(1).max(50),
  minute: z.number().int().min(0).nullable().optional(),
  setNumber: z.number().int().min(1).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
});

const submitResultSchema = z.object({
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  sets: z.array(matchSetInputSchema).nullable().optional(),
  events: z.array(matchEventInputSchema).nullable().optional(),
});

export class MatchService {
  constructor(private db: Kysely<Database>) {}

  /**
   * Generate all matches for a tournament based on its format.
   */
  async generateMatches(
    tournamentId: string,
    userId: string,
    userRole: string
  ): Promise<Match[]> {
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

    if (tournament.organizer_id !== userId && userRole !== 'admin') {
      throw new GraphQLError('Not authorized', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    const teams = await this.db
      .selectFrom('teams')
      .selectAll()
      .where('tournament_id', '=', tournamentId)
      .orderBy('seed', 'asc')
      .orderBy('created_at', 'asc')
      .execute();

    if (teams.length < 2) {
      throw new GraphQLError('Need at least 2 teams to generate matches', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    // Delete existing matches for this tournament
    await this.db
      .deleteFrom('matches')
      .where('tournament_id', '=', tournamentId)
      .execute();

    const teamEntries = teams.map((t) => ({
      id: t.id,
      seed: t.seed ?? undefined,
    }));

    const matchInserts: Array<{
      tournament_id: string;
      home_team_id: string | null;
      away_team_id: string | null;
      round: number;
      round_name: string | null;
      group_name: string | null;
      bracket_position: number | null;
    }> = [];

    switch (tournament.format) {
      case 'round_robin': {
        const rounds = generateRoundRobin(teamEntries);
        for (let r = 0; r < rounds.length; r++) {
          for (const pairing of rounds[r]) {
            matchInserts.push({
              tournament_id: tournamentId,
              home_team_id: pairing.homeTeamId,
              away_team_id: pairing.awayTeamId,
              round: r + 1,
              round_name: `Round ${r + 1}`,
              group_name: null,
              bracket_position: null,
            });
          }
        }
        break;
      }

      case 'single_elimination': {
        const bracket = generateSingleElimination(teamEntries);
        for (const m of bracket) {
          matchInserts.push({
            tournament_id: tournamentId,
            home_team_id: m.homeTeamId,
            away_team_id: m.awayTeamId,
            round: m.round,
            round_name: m.roundName,
            group_name: null,
            bracket_position: m.bracketPosition,
          });
        }
        break;
      }

      case 'double_elimination': {
        const bracket = generateDoubleElimination(teamEntries);
        for (const m of bracket) {
          matchInserts.push({
            tournament_id: tournamentId,
            home_team_id: m.homeTeamId,
            away_team_id: m.awayTeamId,
            round: m.round,
            round_name: m.roundName,
            group_name: null,
            bracket_position: m.bracketPosition,
          });
        }
        break;
      }

      case 'group_stage_knockout': {
        const groupCount = tournament.group_count ?? 2;
        const advancePerGroup = tournament.teams_per_group_advance ?? 2;
        const matches = generateGroupStageKnockout(
          teamEntries,
          groupCount,
          advancePerGroup
        );
        for (const m of matches) {
          matchInserts.push({
            tournament_id: tournamentId,
            home_team_id: m.homeTeamId,
            away_team_id: m.awayTeamId,
            round: m.round,
            round_name: m.roundName,
            group_name: m.groupName ?? null,
            bracket_position: m.bracketPosition,
          });
        }
        break;
      }

      default:
        throw new GraphQLError(`Unsupported format: ${tournament.format}`, {
          extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    if (matchInserts.length === 0) {
      return [];
    }

    const created = await this.db
      .insertInto('matches')
      .values(matchInserts)
      .returningAll()
      .execute();

    return created;
  }

  async updateMatchSchedule(
    id: string,
    userId: string,
    userRole: string,
    input: unknown
  ): Promise<Match> {
    const data = updateScheduleSchema.parse(input);
    const match = await this.getById(id);

    if (!match) {
      throw new GraphQLError('Match not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Verify auth via tournament
    const tournament = await this.db
      .selectFrom('tournaments')
      .selectAll()
      .where('id', '=', match.tournament_id)
      .executeTakeFirst();

    if (!tournament || (tournament.organizer_id !== userId && userRole !== 'admin' && userRole !== 'referee')) {
      throw new GraphQLError('Not authorized', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    const updateData: Record<string, unknown> = { updated_at: new Date() };
    if (data.venueId !== undefined) updateData.venue_id = data.venueId;
    if (data.scheduledAt !== undefined) updateData.scheduled_at = data.scheduledAt;
    if (data.refereeId !== undefined) updateData.referee_id = data.refereeId;

    return this.db
      .updateTable('matches')
      .set(updateData)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Submit a match result with sport-specific validation.
   * Football: score + events (goals, cards)
   * Volleyball: sets best-of-3 or best-of-5, 25pts per set, 5th set 15pts, 2pt lead
   * Badminton: sets best-of-3, 21pts per set, 2pt lead, max 30
   */
  async submitMatchResult(
    id: string,
    userId: string,
    userRole: string,
    input: unknown
  ): Promise<Match> {
    const data = submitResultSchema.parse(input);
    const match = await this.getById(id);

    if (!match) {
      throw new GraphQLError('Match not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    if (match.status === 'completed') {
      throw new GraphQLError('Match result already submitted', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    const tournament = await this.db
      .selectFrom('tournaments')
      .selectAll()
      .where('id', '=', match.tournament_id)
      .executeTakeFirst();

    if (!tournament) {
      throw new GraphQLError('Tournament not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    if (tournament.organizer_id !== userId && userRole !== 'admin' && userRole !== 'referee') {
      throw new GraphQLError('Not authorized', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    const sport = tournament.sport as SharedSportType;
    const rules = SPORT_RULES[sport];

    // Sport-specific validation
    if (rules.scoring.type === 'sets') {
      if (!data.sets || data.sets.length === 0) {
        throw new GraphQLError('Set scores are required for this sport', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      this.validateSets(data.sets, rules);
    }

    // Determine winner
    let winnerTeamId: string | null = null;
    let isDraw = false;

    if (rules.scoring.type === 'sets' && data.sets) {
      let homeSetsWon = 0;
      let awaySetsWon = 0;
      for (const set of data.sets) {
        if (set.homeScore > set.awayScore) homeSetsWon++;
        else awaySetsWon++;
      }
      if (homeSetsWon > awaySetsWon) {
        winnerTeamId = match.home_team_id;
      } else {
        winnerTeamId = match.away_team_id;
      }
    } else {
      if (data.homeScore > data.awayScore) {
        winnerTeamId = match.home_team_id;
      } else if (data.awayScore > data.homeScore) {
        winnerTeamId = match.away_team_id;
      } else {
        isDraw = true;
      }
    }

    // Update match
    const updatedMatch = await this.db
      .updateTable('matches')
      .set({
        home_score: data.homeScore,
        away_score: data.awayScore,
        winner_team_id: winnerTeamId,
        is_draw: isDraw,
        status: 'completed',
        ended_at: new Date(),
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    // Insert sets if provided
    if (data.sets && data.sets.length > 0) {
      // Delete existing sets
      await this.db.deleteFrom('match_sets').where('match_id', '=', id).execute();

      await this.db
        .insertInto('match_sets')
        .values(
          data.sets.map((s) => ({
            match_id: id,
            set_number: s.setNumber,
            home_score: s.homeScore,
            away_score: s.awayScore,
          }))
        )
        .execute();
    }

    // Insert events if provided
    if (data.events && data.events.length > 0) {
      await this.db
        .insertInto('match_events')
        .values(
          data.events.map((e) => ({
            match_id: id,
            team_id: e.teamId,
            player_id: e.playerId ?? null,
            event_type: e.eventType,
            minute: e.minute ?? null,
            set_number: e.setNumber ?? null,
            description: e.description ?? null,
          }))
        )
        .execute();
    }

    // Recalculate standings for group/round-robin matches
    await this.recalculateStandings(tournament.id);

    // Advance bracket if elimination format
    if (
      winnerTeamId &&
      match.bracket_position &&
      (tournament.format === 'single_elimination' ||
        tournament.format === 'double_elimination' ||
        tournament.format === 'group_stage_knockout')
    ) {
      await this.advanceBracket(match, winnerTeamId);
    }

    return updatedMatch;
  }

  private validateSets(
    sets: Array<{ setNumber: number; homeScore: number; awayScore: number }>,
    rules: (typeof SPORT_RULES)[SharedSportType]
  ): void {
    const setsToWin = rules.scoring.setsToWin ?? 2;
    const pointsPerSet = rules.scoring.pointsPerSet ?? 21;
    const finalSetPoints = rules.scoring.finalSetPoints ?? pointsPerSet;
    const minLead = rules.scoring.minPointLead;
    const maxPoints = rules.scoring.maxPoints;

    let homeSetsWon = 0;
    let awaySetsWon = 0;

    for (const set of sets) {
      const isFinalSet = set.setNumber === setsToWin * 2 - 1;
      const target = isFinalSet ? finalSetPoints : pointsPerSet;
      const cap = maxPoints ?? Infinity;

      const winnerScore = Math.max(set.homeScore, set.awayScore);
      const loserScore = Math.min(set.homeScore, set.awayScore);
      const lead = winnerScore - loserScore;

      // Scores must be non-negative
      if (set.homeScore < 0 || set.awayScore < 0) {
        throw new GraphQLError(
          `Set ${set.setNumber}: điểm không được âm`,
          { extensions: { code: 'BAD_USER_INPUT' } }
        );
      }

      // Scores must not be equal
      if (set.homeScore === set.awayScore) {
        throw new GraphQLError(
          `Set ${set.setNumber}: điểm hai đội không được bằng nhau`,
          { extensions: { code: 'BAD_USER_INPUT' } }
        );
      }

      // Winner must reach at least target points
      if (winnerScore < target) {
        throw new GraphQLError(
          `Set ${set.setNumber}: đội thắng cần đạt ít nhất ${target} điểm`,
          { extensions: { code: 'BAD_USER_INPUT' } }
        );
      }

      // Validate score based on game rules:
      // Case 1: Winner scores exactly target → loser must have < target - minLead + 1
      //   e.g., volleyball: 25-23 OK, 25-24 needs deuce → goes to 26-24
      // Case 2: Winner scores above target (deuce) → must have exactly minLead lead
      //   e.g., 26-24, 27-25, 28-26 OK. 28-24 NOT OK (game ended earlier)
      // Case 3: At cap (badminton 30) → winner = cap, loser = cap - 1 or less
      if (winnerScore > cap) {
        throw new GraphQLError(
          `Set ${set.setNumber}: điểm không được vượt quá ${cap}`,
          { extensions: { code: 'BAD_USER_INPUT' } }
        );
      }

      if (winnerScore === cap) {
        // At cap: loser must be cap-1 or cap-2 (depending on minLead)
        if (loserScore < cap - minLead || loserScore >= cap) {
          throw new GraphQLError(
            `Set ${set.setNumber}: tỉ số ${winnerScore}-${loserScore} không hợp lệ khi đạt điểm tối đa`,
            { extensions: { code: 'BAD_USER_INPUT' } }
          );
        }
      } else if (winnerScore === target) {
        // Exact target: loser must be below target - minLead + 1
        // e.g., target=25, minLead=2: loser max = 23
        if (loserScore > target - minLead) {
          throw new GraphQLError(
            `Set ${set.setNumber}: tỉ số ${winnerScore}-${loserScore} không hợp lệ (loser quá cao, cần qua deuce)`,
            { extensions: { code: 'BAD_USER_INPUT' } }
          );
        }
      } else {
        // Above target (deuce): must have exactly minLead lead
        // AND loser must be at least target - minLead + 1 (they were in deuce)
        if (lead !== minLead) {
          throw new GraphQLError(
            `Set ${set.setNumber}: trong deuce cần chênh lệch đúng ${minLead} điểm (hiện: ${lead})`,
            { extensions: { code: 'BAD_USER_INPUT' } }
          );
        }
        if (loserScore < target - 1) {
          throw new GraphQLError(
            `Set ${set.setNumber}: tỉ số ${winnerScore}-${loserScore} không hợp lệ`,
            { extensions: { code: 'BAD_USER_INPUT' } }
          );
        }
      }

      if (set.homeScore > set.awayScore) homeSetsWon++;
      else awaySetsWon++;
    }

    // One team must have won enough sets
    if (homeSetsWon < setsToWin && awaySetsWon < setsToWin) {
      throw new GraphQLError(
        `Trận đấu chưa kết thúc: cần thắng ${setsToWin} set`,
        { extensions: { code: 'BAD_USER_INPUT' } }
      );
    }
  }

  /**
   * Advance the winner to the next bracket match.
   */
  private async advanceBracket(
    match: Match,
    winnerTeamId: string
  ): Promise<void> {
    if (!match.bracket_position) return;

    // Find next match: the winner of bracket_position N goes to
    // the match at position ceil(N/2) in the next round
    const nextBracketPosition = Math.ceil(match.bracket_position / 2);
    const isHomeInNext = match.bracket_position % 2 === 1;

    const nextMatch = await this.db
      .selectFrom('matches')
      .selectAll()
      .where('tournament_id', '=', match.tournament_id)
      .where('round', '=', match.round + 1)
      .where('bracket_position', '=', nextBracketPosition + this.getBracketOffset(match))
      .executeTakeFirst();

    if (!nextMatch) return;

    const updateField = isHomeInNext ? 'home_team_id' : 'away_team_id';
    await this.db
      .updateTable('matches')
      .set({ [updateField]: winnerTeamId, updated_at: new Date() })
      .where('id', '=', nextMatch.id)
      .execute();
  }

  private getBracketOffset(match: Match): number {
    // For matches in the same round group, calculate the offset
    // This is a simplified version; in practice bracket position is absolute
    return 0;
  }

  /**
   * Recalculate standings for all completed matches in the tournament.
   */
  private async recalculateStandings(tournamentId: string): Promise<void> {
    const tournament = await this.db
      .selectFrom('tournaments')
      .selectAll()
      .where('id', '=', tournamentId)
      .executeTakeFirst();

    if (!tournament) return;

    const completedMatches = await this.db
      .selectFrom('matches')
      .selectAll()
      .where('tournament_id', '=', tournamentId)
      .where('status', '=', 'completed')
      .execute();

    const teams = await this.db
      .selectFrom('teams')
      .selectAll()
      .where('tournament_id', '=', tournamentId)
      .execute();

    // Delete existing standings
    await this.db
      .deleteFrom('standings')
      .where('tournament_id', '=', tournamentId)
      .execute();

    if (completedMatches.length === 0 || teams.length === 0) return;

    // Build standings per team
    const standingsMap = new Map<
      string,
      {
        played: number;
        won: number;
        drawn: number;
        lost: number;
        goalsFor: number;
        goalsAgainst: number;
        setsWon: number;
        setsLost: number;
        points: number;
        groupName: string | null;
      }
    >();

    for (const team of teams) {
      standingsMap.set(team.id, {
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        setsWon: 0,
        setsLost: 0,
        points: 0,
        groupName: team.group_name,
      });
    }

    for (const match of completedMatches) {
      if (!match.home_team_id || !match.away_team_id) continue;
      const home = standingsMap.get(match.home_team_id);
      const away = standingsMap.get(match.away_team_id);
      if (!home || !away) continue;

      home.played++;
      away.played++;
      home.goalsFor += match.home_score ?? 0;
      home.goalsAgainst += match.away_score ?? 0;
      away.goalsFor += match.away_score ?? 0;
      away.goalsAgainst += match.home_score ?? 0;

      // Load sets for this match
      const sets = await this.db
        .selectFrom('match_sets')
        .selectAll()
        .where('match_id', '=', match.id)
        .execute();

      for (const set of sets) {
        if (set.home_score > set.away_score) {
          home.setsWon++;
          away.setsLost++;
        } else if (set.away_score > set.home_score) {
          away.setsWon++;
          home.setsLost++;
        }
      }

      if (match.is_draw) {
        home.drawn++;
        away.drawn++;
        home.points += tournament.points_for_draw;
        away.points += tournament.points_for_draw;
      } else if (match.winner_team_id === match.home_team_id) {
        home.won++;
        away.lost++;
        home.points += tournament.points_for_win;
        away.points += tournament.points_for_loss;
      } else {
        away.won++;
        home.lost++;
        away.points += tournament.points_for_win;
        home.points += tournament.points_for_loss;
      }
    }

    // Sort and assign ranks
    const entries = [...standingsMap.entries()].map(([teamId, s]) => ({
      teamId,
      ...s,
      goalDifference: s.goalsFor - s.goalsAgainst,
    }));

    entries.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

    const standingsInserts = entries.map((e, i) => ({
      tournament_id: tournamentId,
      team_id: e.teamId,
      group_name: e.groupName,
      played: e.played,
      won: e.won,
      drawn: e.drawn,
      lost: e.lost,
      goals_for: e.goalsFor,
      goals_against: e.goalsAgainst,
      goal_difference: e.goalDifference,
      points: e.points,
      sets_won: e.setsWon,
      sets_lost: e.setsLost,
      rank: i + 1,
    }));

    if (standingsInserts.length > 0) {
      await this.db
        .insertInto('standings')
        .values(standingsInserts)
        .execute();
    }
  }

  async addMatchEvent(
    matchId: string,
    userId: string,
    userRole: string,
    input: unknown
  ): Promise<MatchEvent> {
    const data = matchEventInputSchema.parse(input);
    const match = await this.getById(matchId);

    if (!match) {
      throw new GraphQLError('Match not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    const tournament = await this.db
      .selectFrom('tournaments')
      .selectAll()
      .where('id', '=', match.tournament_id)
      .executeTakeFirst();

    if (!tournament || (tournament.organizer_id !== userId && userRole !== 'admin' && userRole !== 'referee')) {
      throw new GraphQLError('Not authorized', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    return this.db
      .insertInto('match_events')
      .values({
        match_id: matchId,
        team_id: data.teamId,
        player_id: data.playerId ?? null,
        event_type: data.eventType,
        minute: data.minute ?? null,
        set_number: data.setNumber ?? null,
        description: data.description ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getById(id: string): Promise<Match | undefined> {
    return this.db
      .selectFrom('matches')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async getMatchesByTournament(tournamentId: string): Promise<Match[]> {
    return this.db
      .selectFrom('matches')
      .selectAll()
      .where('tournament_id', '=', tournamentId)
      .orderBy('round', 'asc')
      .orderBy('bracket_position', 'asc')
      .execute();
  }

  async getMatchesByTeam(teamId: string): Promise<Match[]> {
    return this.db
      .selectFrom('matches')
      .selectAll()
      .where((eb) =>
        eb.or([
          eb('home_team_id', '=', teamId),
          eb('away_team_id', '=', teamId),
        ])
      )
      .orderBy('scheduled_at', 'asc')
      .execute();
  }

  async getUpcomingMatches(
    tournamentId: string,
    limit: number = 10
  ): Promise<Match[]> {
    return this.db
      .selectFrom('matches')
      .selectAll()
      .where('tournament_id', '=', tournamentId)
      .where('status', '=', 'scheduled')
      .orderBy('scheduled_at', 'asc')
      .limit(Math.min(limit, 50))
      .execute();
  }
}
