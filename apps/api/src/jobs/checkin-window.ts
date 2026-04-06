import type { Kysely } from 'kysely';
import type { Database } from '@sporthub/db';
import { logger } from '../lib/logger.js';

/**
 * Auto-open check-in 60 minutes before match start,
 * auto-close 10 minutes before match start.
 */
export async function processCheckinWindows(db: Kysely<Database>): Promise<void> {
  const now = new Date();
  const sixtyMinLater = new Date(now.getTime() + 60 * 60 * 1000);
  const tenMinLater = new Date(now.getTime() + 10 * 60 * 1000);

  // Auto-open: matches scheduled within the next 60 minutes that are still 'scheduled'
  const toOpen = await db
    .selectFrom('matches')
    .selectAll()
    .where('status', '=', 'scheduled')
    .where('scheduled_at', 'is not', null)
    .where('scheduled_at', '<=', sixtyMinLater)
    .where('scheduled_at', '>', tenMinLater)
    .execute();

  for (const match of toOpen) {
    try {
      // Get players for both teams
      const teamIds = [match.home_team_id, match.away_team_id].filter(Boolean) as string[];
      if (teamIds.length === 0) continue;

      const players = await db
        .selectFrom('team_players')
        .selectAll()
        .where('team_id', 'in', teamIds)
        .where('is_active', '=', true)
        .execute();

      // Create pending checkin records
      if (players.length > 0) {
        const existing = await db
          .selectFrom('match_checkins')
          .select(['id'])
          .where('match_id', '=', match.id)
          .executeTakeFirst();

        if (!existing) {
          await db
            .insertInto('match_checkins')
            .values(
              players.map((p) => ({
                match_id: match.id,
                team_id: p.team_id,
                player_id: p.id,
                status: 'pending' as const,
              }))
            )
            .execute();
        }
      }

      await db
        .updateTable('matches')
        .set({ status: 'checkin_open', updated_at: new Date() })
        .where('id', '=', match.id)
        .execute();

      logger.info({ matchId: match.id }, 'Auto-opened check-in window');
    } catch (error: unknown) {
      logger.error({ matchId: match.id, error }, 'Failed to auto-open check-in');
    }
  }

  // Auto-close: matches with check-in open that start within 10 minutes
  const toClose = await db
    .selectFrom('matches')
    .selectAll()
    .where('status', '=', 'checkin_open')
    .where('scheduled_at', 'is not', null)
    .where('scheduled_at', '<=', tenMinLater)
    .execute();

  for (const match of toClose) {
    try {
      // Mark pending as absent
      await db
        .updateTable('match_checkins')
        .set({ status: 'absent' })
        .where('match_id', '=', match.id)
        .where('status', '=', 'pending')
        .execute();

      // Invalidate QR codes
      await db
        .updateTable('checkin_qr_codes')
        .set({ is_used: true })
        .where('match_id', '=', match.id)
        .execute();

      await db
        .updateTable('matches')
        .set({ status: 'scheduled', updated_at: new Date() })
        .where('id', '=', match.id)
        .execute();

      logger.info({ matchId: match.id }, 'Auto-closed check-in window');
    } catch (error: unknown) {
      logger.error({ matchId: match.id, error }, 'Failed to auto-close check-in');
    }
  }
}
