import { GraphQLError } from 'graphql';
import { z } from 'zod';
import type { Kysely } from 'kysely';
import type { Database, TeamPlayer } from '@sporthub/db';

const addPlayerSchema = z.object({
  teamId: z.string().uuid(),
  userId: z.string().uuid().nullable().optional(),
  fullName: z.string().min(1).max(255),
  jerseyNumber: z.number().int().min(0).max(999),
  position: z.string().max(50).nullable().optional(),
});

const updatePlayerSchema = z.object({
  fullName: z.string().min(1).max(255).optional(),
  jerseyNumber: z.number().int().min(0).max(999).optional(),
  position: z.string().max(50).nullable().optional(),
  isActive: z.boolean().optional(),
});

export class PlayerService {
  constructor(private db: Kysely<Database>) {}

  async addPlayer(userId: string, userRole: string, input: unknown): Promise<TeamPlayer> {
    const data = addPlayerSchema.parse(input);

    // Verify team exists and user is manager or admin
    const team = await this.db
      .selectFrom('teams')
      .selectAll()
      .where('id', '=', data.teamId)
      .executeTakeFirst();

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

    // Check max roster size from tournament
    const tournament = await this.db
      .selectFrom('tournaments')
      .selectAll()
      .where('id', '=', team.tournament_id)
      .executeTakeFirst();

    if (tournament) {
      const { count } = await this.db
        .selectFrom('team_players')
        .select(({ fn }) => fn.countAll<number>().as('count'))
        .where('team_id', '=', data.teamId)
        .where('is_active', '=', true)
        .executeTakeFirstOrThrow();

      if (Number(count) >= tournament.max_players_per_team) {
        throw new GraphQLError(
          `Team already has maximum of ${tournament.max_players_per_team} active players`,
          { extensions: { code: 'BAD_USER_INPUT' } }
        );
      }
    }

    // Check unique jersey number within team
    const existing = await this.db
      .selectFrom('team_players')
      .selectAll()
      .where('team_id', '=', data.teamId)
      .where('jersey_number', '=', data.jerseyNumber)
      .executeTakeFirst();

    if (existing) {
      throw new GraphQLError(
        `Jersey number ${data.jerseyNumber} is already taken in this team`,
        { extensions: { code: 'BAD_USER_INPUT' } }
      );
    }

    return this.db
      .insertInto('team_players')
      .values({
        team_id: data.teamId,
        user_id: data.userId ?? null,
        full_name: data.fullName,
        jersey_number: data.jerseyNumber,
        position: data.position ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async removePlayer(
    id: string,
    userId: string,
    userRole: string
  ): Promise<boolean> {
    const player = await this.getById(id);
    if (!player) {
      throw new GraphQLError('Player not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    const team = await this.db
      .selectFrom('teams')
      .selectAll()
      .where('id', '=', player.team_id)
      .executeTakeFirst();

    if (!team || (team.manager_id !== userId && userRole !== 'admin')) {
      throw new GraphQLError('Not authorized', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    await this.db.deleteFrom('team_players').where('id', '=', id).execute();
    return true;
  }

  async updatePlayer(
    id: string,
    userId: string,
    userRole: string,
    input: unknown
  ): Promise<TeamPlayer> {
    const data = updatePlayerSchema.parse(input);
    const player = await this.getById(id);

    if (!player) {
      throw new GraphQLError('Player not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    const team = await this.db
      .selectFrom('teams')
      .selectAll()
      .where('id', '=', player.team_id)
      .executeTakeFirst();

    if (!team || (team.manager_id !== userId && userRole !== 'admin')) {
      throw new GraphQLError('Not authorized', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    // Check jersey uniqueness if changing
    if (data.jerseyNumber !== undefined && data.jerseyNumber !== player.jersey_number) {
      const existing = await this.db
        .selectFrom('team_players')
        .selectAll()
        .where('team_id', '=', player.team_id)
        .where('jersey_number', '=', data.jerseyNumber)
        .where('id', '!=', id)
        .executeTakeFirst();

      if (existing) {
        throw new GraphQLError(
          `Jersey number ${data.jerseyNumber} is already taken in this team`,
          { extensions: { code: 'BAD_USER_INPUT' } }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.fullName !== undefined) updateData.full_name = data.fullName;
    if (data.jerseyNumber !== undefined) updateData.jersey_number = data.jerseyNumber;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    if (Object.keys(updateData).length === 0) {
      return player;
    }

    return this.db
      .updateTable('team_players')
      .set(updateData)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Set a single captain for a team. Removes captain status from others.
   */
  async setCaptain(
    teamId: string,
    playerId: string,
    userId: string,
    userRole: string
  ): Promise<TeamPlayer> {
    const team = await this.db
      .selectFrom('teams')
      .selectAll()
      .where('id', '=', teamId)
      .executeTakeFirst();

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

    const player = await this.getById(playerId);
    if (!player || player.team_id !== teamId) {
      throw new GraphQLError('Player not found in this team', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Remove captain from all other players in team
    await this.db
      .updateTable('team_players')
      .set({ is_captain: false })
      .where('team_id', '=', teamId)
      .where('id', '!=', playerId)
      .execute();

    // Set this player as captain
    return this.db
      .updateTable('team_players')
      .set({ is_captain: true })
      .where('id', '=', playerId)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getPlayersByTeam(teamId: string): Promise<TeamPlayer[]> {
    return this.db
      .selectFrom('team_players')
      .selectAll()
      .where('team_id', '=', teamId)
      .orderBy('jersey_number', 'asc')
      .execute();
  }

  async getById(id: string): Promise<TeamPlayer | undefined> {
    return this.db
      .selectFrom('team_players')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }
}
