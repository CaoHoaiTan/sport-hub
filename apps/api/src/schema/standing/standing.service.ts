import type { Kysely } from 'kysely';
import type { Database, Standing, PlayerStatistic } from '@sporthub/db';

export class StandingService {
  constructor(private db: Kysely<Database>) {}

  async getStandingsByTournament(
    tournamentId: string,
    groupName?: string
  ): Promise<Standing[]> {
    let query = this.db
      .selectFrom('standings')
      .selectAll()
      .where('tournament_id', '=', tournamentId)
      .orderBy('rank', 'asc');

    if (groupName) {
      query = query.where('group_name', '=', groupName);
    }

    return query.execute();
  }

  async getPlayerStatistics(
    tournamentId: string,
    teamId?: string
  ): Promise<PlayerStatistic[]> {
    let query = this.db
      .selectFrom('player_statistics')
      .selectAll()
      .where('tournament_id', '=', tournamentId)
      .orderBy('goals', 'desc')
      .orderBy('assists', 'desc');

    if (teamId) {
      query = query.where('team_id', '=', teamId);
    }

    return query.execute();
  }
}
