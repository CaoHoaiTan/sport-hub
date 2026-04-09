import { GraphQLError } from 'graphql';
import { z } from 'zod';
import type { Kysely } from 'kysely';
import type { Database, Tournament, TournamentStatus } from '@sporthub/db';
import { generateSlug, SPORT_RULES, TOURNAMENT_TRANSITIONS } from '@sporthub/shared';
import type { SportType as SharedSportType } from '@sporthub/shared';

const createTournamentSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(5000).nullable().optional(),
  sport: z.enum(['football', 'volleyball', 'badminton']),
  format: z.enum(['round_robin', 'single_elimination', 'double_elimination', 'group_stage_knockout']),
  maxTeams: z.number().int().min(2).nullable().optional(),
  minPlayersPerTeam: z.number().int().min(1),
  maxPlayersPerTeam: z.number().int().min(1),
  groupCount: z.number().int().min(2).nullable().optional(),
  teamsPerGroupAdvance: z.number().int().min(1).nullable().optional(),
  registrationStart: z.coerce.date().nullable().optional(),
  registrationEnd: z.coerce.date().nullable().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  pointsForWin: z.number().int().optional(),
  pointsForDraw: z.number().int().optional(),
  pointsForLoss: z.number().int().optional(),
  entryFee: z.number().min(0).nullable().optional(),
  currency: z.string().max(3).optional(),
  bannerUrl: z.string().url().nullable().optional(),
  rulesText: z.string().max(10000).nullable().optional(),
});

export class TournamentService {
  constructor(private db: Kysely<Database>) {}

  async create(organizerId: string, input: unknown): Promise<Tournament> {
    const data = createTournamentSchema.parse(input);

    // Validate sport-specific roster rules
    const rules = SPORT_RULES[data.sport as SharedSportType];
    if (data.minPlayersPerTeam < rules.minPlayersPerTeam.min ||
        data.minPlayersPerTeam > rules.minPlayersPerTeam.max) {
      throw new GraphQLError(
        `minPlayersPerTeam must be between ${rules.minPlayersPerTeam.min} and ${rules.minPlayersPerTeam.max} for ${data.sport}`,
        { extensions: { code: 'BAD_USER_INPUT' } }
      );
    }
    if (data.maxPlayersPerTeam < rules.maxPlayersPerTeam.min ||
        data.maxPlayersPerTeam > rules.maxPlayersPerTeam.max) {
      throw new GraphQLError(
        `maxPlayersPerTeam must be between ${rules.maxPlayersPerTeam.min} and ${rules.maxPlayersPerTeam.max} for ${data.sport}`,
        { extensions: { code: 'BAD_USER_INPUT' } }
      );
    }

    if (data.registrationEnd && data.registrationEnd >= data.startDate) {
      throw new GraphQLError('registrationEnd must be before startDate', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    if (data.format === 'group_stage_knockout' && !data.groupCount) {
      throw new GraphQLError('groupCount is required for group_stage_knockout format', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    const slug = generateSlug(data.name);

    const tournament = await this.db
      .insertInto('tournaments')
      .values({
        name: data.name,
        slug,
        description: data.description ?? null,
        sport: data.sport,
        format: data.format,
        organizer_id: organizerId,
        max_teams: data.maxTeams ?? null,
        min_players_per_team: data.minPlayersPerTeam,
        max_players_per_team: data.maxPlayersPerTeam,
        group_count: data.groupCount ?? null,
        teams_per_group_advance: data.teamsPerGroupAdvance ?? null,
        registration_start: data.registrationStart ?? null,
        registration_end: data.registrationEnd ?? null,
        start_date: data.startDate,
        end_date: data.endDate ?? null,
        points_for_win: data.pointsForWin ?? 3,
        points_for_draw: data.pointsForDraw ?? 1,
        points_for_loss: data.pointsForLoss ?? 0,
        entry_fee: data.entryFee ?? 0,
        currency: data.currency ?? 'VND',
        banner_url: data.bannerUrl ?? null,
        rules_text: data.rulesText ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return tournament;
  }

  async update(id: string, userId: string, userRole: string, input: unknown): Promise<Tournament> {
    const tournament = await this.getById(id);
    if (!tournament) {
      throw new GraphQLError('Tournament not found', { extensions: { code: 'NOT_FOUND' } });
    }
    if (tournament.organizer_id !== userId && userRole !== 'admin') {
      throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } });
    }

    const data = input as Record<string, unknown>;
    const updateData: Record<string, unknown> = { updated_at: new Date() };

    const fieldMap: Record<string, string> = {
      name: 'name', description: 'description', maxTeams: 'max_teams',
      registrationStart: 'registration_start', registrationEnd: 'registration_end',
      startDate: 'start_date', endDate: 'end_date',
      pointsForWin: 'points_for_win', pointsForDraw: 'points_for_draw',
      pointsForLoss: 'points_for_loss', entryFee: 'entry_fee',
      bannerUrl: 'banner_url', rulesText: 'rules_text',
    };

    for (const [gqlField, dbField] of Object.entries(fieldMap)) {
      if (data[gqlField] !== undefined) {
        updateData[dbField] = data[gqlField];
      }
    }

    const updated = await this.db
      .updateTable('tournaments')
      .set(updateData)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    // Sync default payment plan amount when entryFee changes
    if (data.entryFee !== undefined) {
      await this.db
        .updateTable('payment_plans')
        .set({ amount: String(data.entryFee) })
        .where('tournament_id', '=', id)
        .where('name', '=', 'Lệ phí tham gia')
        .execute();
    }

    return updated;
  }

  async delete(id: string, userId: string, userRole: string): Promise<boolean> {
    const tournament = await this.getById(id);
    if (!tournament) {
      throw new GraphQLError('Tournament not found', { extensions: { code: 'NOT_FOUND' } });
    }
    if (tournament.organizer_id !== userId && userRole !== 'admin') {
      throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } });
    }
    if (tournament.status !== 'draft') {
      throw new GraphQLError('Can only delete tournaments in draft status', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    await this.db.deleteFrom('tournaments').where('id', '=', id).execute();
    return true;
  }

  async updateStatus(id: string, newStatus: TournamentStatus, userId: string, userRole: string): Promise<Tournament> {
    const tournament = await this.getById(id);
    if (!tournament) {
      throw new GraphQLError('Tournament not found', { extensions: { code: 'NOT_FOUND' } });
    }
    if (tournament.organizer_id !== userId && userRole !== 'admin') {
      throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } });
    }

    const allowed = TOURNAMENT_TRANSITIONS[tournament.status as TournamentStatus];
    if (!allowed.includes(newStatus)) {
      throw new GraphQLError(
        `Cannot transition from '${tournament.status}' to '${newStatus}'`,
        { extensions: { code: 'BAD_USER_INPUT' } }
      );
    }

    // When opening registration with entry fee, ensure payment plan exists
    if (newStatus === 'registration' && parseFloat(tournament.entry_fee ?? '0') > 0) {
      const plans = await this.db
        .selectFrom('payment_plans')
        .select('id')
        .where('tournament_id', '=', id)
        .execute();

      if (plans.length === 0) {
        // Auto-create a default payment plan from entryFee
        await this.db
          .insertInto('payment_plans')
          .values({
            tournament_id: id,
            name: 'Lệ phí tham gia',
            amount: tournament.entry_fee!,
            currency: tournament.currency ?? 'VND',
            per_team: true,
          })
          .execute();
      }
    }

    return this.db
      .updateTable('tournaments')
      .set({ status: newStatus, updated_at: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getById(id: string): Promise<Tournament | undefined> {
    return this.db
      .selectFrom('tournaments')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async getByIdOrSlug(id?: string, slug?: string): Promise<Tournament | null> {
    let query = this.db.selectFrom('tournaments').selectAll();
    if (id) query = query.where('id', '=', id);
    else if (slug) query = query.where('slug', '=', slug);
    else return null;

    const result = await query.executeTakeFirst();
    return result ?? null;
  }

  async list(
    filter?: { sport?: string; status?: string; organizerId?: string; search?: string },
    pagination?: { first?: number; after?: string }
  ) {
    const limit = Math.min(pagination?.first ?? 20, 100);
    let query = this.db.selectFrom('tournaments').selectAll().orderBy('created_at', 'desc').limit(limit + 1);

    if (filter?.sport) query = query.where('sport', '=', filter.sport as never);
    if (filter?.status) query = query.where('status', '=', filter.status as never);
    if (filter?.organizerId) query = query.where('organizer_id', '=', filter.organizerId);
    if (filter?.search) query = query.where('name', 'ilike', `%${filter.search}%`);

    if (pagination?.after) {
      const cursor = Buffer.from(pagination.after, 'base64').toString('utf-8');
      query = query.where('created_at', '<', new Date(cursor));
    }

    const rows = await query.execute();
    const hasNextPage = rows.length > limit;
    const edges = rows.slice(0, limit).map((t) => ({
      cursor: Buffer.from(t.created_at.toISOString()).toString('base64'),
      node: t,
    }));

    let countQuery = this.db
      .selectFrom('tournaments')
      .select(({ fn }) => fn.countAll<number>().as('count'));
    if (filter?.sport) countQuery = countQuery.where('sport', '=', filter.sport as never);
    if (filter?.status) countQuery = countQuery.where('status', '=', filter.status as never);

    const totalCount = await countQuery.executeTakeFirstOrThrow();

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage: !!pagination?.after,
        startCursor: edges[0]?.cursor ?? null,
        endCursor: edges[edges.length - 1]?.cursor ?? null,
      },
      totalCount: Number(totalCount.count),
    };
  }

  async getByOrganizer(organizerId: string): Promise<Tournament[]> {
    return this.db
      .selectFrom('tournaments')
      .selectAll()
      .where('organizer_id', '=', organizerId)
      .orderBy('created_at', 'desc')
      .execute();
  }

  async getByParticipant(userId: string): Promise<Tournament[]> {
    return this.db
      .selectFrom('tournaments')
      .selectAll('tournaments')
      .innerJoin('teams', 'teams.tournament_id', 'tournaments.id')
      .where('teams.manager_id', '=', userId)
      .orderBy('tournaments.created_at', 'desc')
      .execute();
  }
}
