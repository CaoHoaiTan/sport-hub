import type { Kysely } from 'kysely';
import type { Database } from '@sporthub/db';
import { NotificationService } from '../schema/notification/notification.service.js';
import { logger } from '../lib/logger.js';

/**
 * Send match reminders 24 hours and 1 hour before match start.
 */
export async function processMatchReminders(db: Kysely<Database>): Promise<void> {
  const now = new Date();
  const notificationService = new NotificationService(db);

  // 24-hour reminder window: matches between 23h55m and 24h5m from now
  const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const twentyFourWindowStart = new Date(twentyFourHoursLater.getTime() - 5 * 60 * 1000);
  const twentyFourWindowEnd = new Date(twentyFourHoursLater.getTime() + 5 * 60 * 1000);

  // 1-hour reminder window: matches between 55m and 65m from now
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  const oneHourWindowStart = new Date(oneHourLater.getTime() - 5 * 60 * 1000);
  const oneHourWindowEnd = new Date(oneHourLater.getTime() + 5 * 60 * 1000);

  const windows = [
    { start: twentyFourWindowStart, end: twentyFourWindowEnd, label: '24 hours' },
    { start: oneHourWindowStart, end: oneHourWindowEnd, label: '1 hour' },
  ];

  for (const window of windows) {
    try {
      const matches = await db
        .selectFrom('matches')
        .selectAll()
        .where('status', 'in', ['scheduled', 'checkin_open'])
        .where('scheduled_at', '>=', window.start)
        .where('scheduled_at', '<=', window.end)
        .execute();

      for (const match of matches) {
        const teamIds = [match.home_team_id, match.away_team_id].filter(Boolean) as string[];
        if (teamIds.length === 0) continue;

        // Get players with user_id for these teams
        const players = await db
          .selectFrom('team_players')
          .select(['user_id'])
          .where('team_id', 'in', teamIds)
          .where('is_active', '=', true)
          .where('user_id', 'is not', null)
          .execute();

        const userIds = players
          .map((p) => p.user_id)
          .filter((id): id is string => id !== null);

        // Also include team managers
        const teams = await db
          .selectFrom('teams')
          .select(['manager_id'])
          .where('id', 'in', teamIds)
          .execute();

        const managerIds = teams.map((t) => t.manager_id);
        const allUserIds = [...new Set([...userIds, ...managerIds])];

        if (allUserIds.length > 0) {
          await notificationService.createBulkNotification(
            allUserIds,
            'match_reminder',
            `Match in ${window.label}`,
            `Your match is scheduled to start in ${window.label}. ${match.scheduled_at ? `Scheduled at: ${match.scheduled_at.toISOString()}` : ''}`,
            { matchId: match.id, tournamentId: match.tournament_id }
          );

          logger.info(
            { matchId: match.id, window: window.label, recipientCount: allUserIds.length },
            'Sent match reminders'
          );
        }
      }
    } catch (error: unknown) {
      logger.error({ error, window: window.label }, 'Failed to process match reminders');
    }
  }
}
