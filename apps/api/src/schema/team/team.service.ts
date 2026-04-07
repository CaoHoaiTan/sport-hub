import { randomInt } from 'node:crypto';
import { GraphQLError } from 'graphql';
import { z } from 'zod';
import type { Kysely } from 'kysely';
import type { Database, Team } from '@sporthub/db';

const registerTeamSchema = z.object({
  tournamentId: z.string().uuid(),
  name: z.string().min(1).max(255),
  logoUrl: z.string().url().nullable().optional(),
});

const playerInputSchema = z.object({
  fullName: z.string().min(1).max(255),
  jerseyNumber: z.number().int().min(0).max(999),
  position: z.string().max(50).nullable().optional(),
});

const registerTeamWithPlayersSchema = z.object({
  tournamentId: z.string().uuid(),
  name: z.string().min(1).max(255),
  logoUrl: z.string().url().nullable().optional(),
  players: z.array(playerInputSchema).min(1),
});

const updateTeamSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  logoUrl: z.string().url().nullable().optional(),
});

export class TeamService {
  constructor(private db: Kysely<Database>) {}

  async registerTeam(managerId: string, input: unknown): Promise<Team> {
    const data = registerTeamSchema.parse(input);

    return this.db.transaction().execute(async (trx) => {
      // Verify tournament exists and is in registration status
      const tournament = await trx
        .selectFrom('tournaments')
        .selectAll()
        .where('id', '=', data.tournamentId)
        .executeTakeFirst();

      if (!tournament) {
        throw new GraphQLError('Tournament not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (tournament.status !== 'registration') {
        throw new GraphQLError('Tournament is not accepting registrations', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Check max teams slot (inside transaction to prevent race condition)
      if (tournament.max_teams) {
        const { count } = await trx
          .selectFrom('teams')
          .select(({ fn }) => fn.countAll<number>().as('count'))
          .where('tournament_id', '=', data.tournamentId)
          .executeTakeFirstOrThrow();

        if (Number(count) >= tournament.max_teams) {
          throw new GraphQLError('Tournament has reached maximum number of teams', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
      }

      const team = await trx
        .insertInto('teams')
        .values({
          tournament_id: data.tournamentId,
          name: data.name,
          logo_url: data.logoUrl ?? null,
          manager_id: managerId,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Auto-upgrade player to team_manager
      await trx
        .updateTable('users')
        .set({ role: 'team_manager', updated_at: new Date() })
        .where('id', '=', managerId)
        .where('role', '=', 'player')
        .execute();

      return team;
    });
  }

  async registerTeamWithPlayers(managerId: string, input: unknown): Promise<Team> {
    const data = registerTeamWithPlayersSchema.parse(input);

    return this.db.transaction().execute(async (trx) => {
      // Verify tournament
      const tournament = await trx
        .selectFrom('tournaments')
        .selectAll()
        .where('id', '=', data.tournamentId)
        .executeTakeFirst();

      if (!tournament) {
        throw new GraphQLError('Không tìm thấy giải đấu', { extensions: { code: 'NOT_FOUND' } });
      }
      if (tournament.status !== 'registration') {
        throw new GraphQLError('Giải đấu hiện không mở đăng ký', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      // Validate player count
      if (data.players.length < tournament.min_players_per_team) {
        throw new GraphQLError(
          `Cần ít nhất ${tournament.min_players_per_team} vận động viên`,
          { extensions: { code: 'BAD_USER_INPUT' } }
        );
      }
      if (data.players.length > tournament.max_players_per_team) {
        throw new GraphQLError(
          `Tối đa ${tournament.max_players_per_team} vận động viên`,
          { extensions: { code: 'BAD_USER_INPUT' } }
        );
      }

      // Check max teams
      if (tournament.max_teams) {
        const { count } = await trx
          .selectFrom('teams')
          .select(({ fn }) => fn.countAll<number>().as('count'))
          .where('tournament_id', '=', data.tournamentId)
          .executeTakeFirstOrThrow();
        if (Number(count) >= tournament.max_teams) {
          throw new GraphQLError('Giải đấu đã đủ đội', { extensions: { code: 'BAD_USER_INPUT' } });
        }
      }

      // Create team
      const team = await trx
        .insertInto('teams')
        .values({
          tournament_id: data.tournamentId,
          name: data.name,
          logo_url: data.logoUrl ?? null,
          manager_id: managerId,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Create players
      for (let i = 0; i < data.players.length; i++) {
        const p = data.players[i];
        await trx
          .insertInto('team_players')
          .values({
            team_id: team.id,
            full_name: p.fullName,
            jersey_number: p.jerseyNumber,
            position: p.position ?? null,
            is_captain: i === 0,
          })
          .execute();
      }

      // Auto-upgrade player to team_manager
      await trx
        .updateTable('users')
        .set({ role: 'team_manager', updated_at: new Date() })
        .where('id', '=', managerId)
        .where('role', '=', 'player')
        .execute();

      return team;
    });
  }

  async updateTeam(
    id: string,
    userId: string,
    userRole: string,
    input: unknown
  ): Promise<Team> {
    const data = updateTeamSchema.parse(input);
    const team = await this.getById(id);

    if (!team) {
      throw new GraphQLError('Team not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    if (team.manager_id !== userId && userRole !== 'admin') {
      throw new GraphQLError('Not authorized', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    const updateData: Record<string, unknown> = { updated_at: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.logoUrl !== undefined) updateData.logo_url = data.logoUrl;

    return this.db
      .updateTable('teams')
      .set(updateData)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async deleteTeam(id: string, userId: string, userRole: string): Promise<boolean> {
    const team = await this.getById(id);

    if (!team) {
      throw new GraphQLError('Team not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Check authorization first
    if (team.manager_id !== userId && userRole !== 'admin') {
      throw new GraphQLError('Not authorized', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    // Verify tournament hasn't started
    const tournament = await this.db
      .selectFrom('tournaments')
      .selectAll()
      .where('id', '=', team.tournament_id)
      .executeTakeFirst();

    if (tournament && tournament.status === 'in_progress') {
      throw new GraphQLError('Cannot delete team after tournament has started', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    await this.db.deleteFrom('teams').where('id', '=', id).execute();
    return true;
  }

  async listTeamsByTournament(tournamentId: string): Promise<Team[]> {
    return this.db
      .selectFrom('teams')
      .selectAll()
      .where('tournament_id', '=', tournamentId)
      .orderBy('seed', 'asc')
      .orderBy('created_at', 'asc')
      .execute();
  }

  async getById(id: string): Promise<Team | undefined> {
    return this.db
      .selectFrom('teams')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  /**
   * Randomly draw groups using snake-draft seeding.
   * Assigns group_name (A, B, C, ...) and seed to each team.
   */
  async drawGroups(
    tournamentId: string,
    groupCount: number,
    userId: string,
    userRole: string
  ): Promise<Team[]> {
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

    const teams = await this.listTeamsByTournament(tournamentId);

    if (teams.length < groupCount * 2) {
      throw new GraphQLError(
        `Need at least ${groupCount * 2} teams for ${groupCount} groups`,
        { extensions: { code: 'BAD_USER_INPUT' } }
      );
    }

    // Shuffle teams randomly
    const shuffled = [...teams];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Snake-draft assignment
    const groupNames = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const updatedTeams: Team[] = [];

    for (let i = 0; i < shuffled.length; i++) {
      const row = Math.floor(i / groupCount);
      const col = row % 2 === 0
        ? i % groupCount
        : groupCount - 1 - (i % groupCount);
      const groupName = groupNames[col];
      const seed = i + 1;

      const updated = await this.db
        .updateTable('teams')
        .set({ group_name: groupName, seed, updated_at: new Date() })
        .where('id', '=', shuffled[i].id)
        .returningAll()
        .executeTakeFirstOrThrow();

      updatedTeams.push(updated);
    }

    return updatedTeams;
  }
}
