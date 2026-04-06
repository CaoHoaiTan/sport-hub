import { createDb } from '@sporthub/db';
import type { Kysely } from 'kysely';
import type { Database } from '@sporthub/db';

let testDb: Kysely<Database> | null = null;

/**
 * Get or create a test database connection.
 */
export function getTestDb(): Kysely<Database> {
  if (!testDb) {
    const connectionString =
      process.env.DATABASE_URL ??
      'postgresql://sporthub:sporthub_dev@localhost:5432/sporthub_test';
    testDb = createDb(connectionString);
  }
  return testDb;
}

/**
 * Clean specific tables for test isolation.
 * Truncates in dependency order.
 */
export async function cleanTables(db: Kysely<Database>, tables: string[]): Promise<void> {
  for (const table of tables) {
    await db.deleteFrom(table as keyof Database).execute();
  }
}

/**
 * Clean all tables for a fresh test state.
 */
export async function cleanAllTables(db: Kysely<Database>): Promise<void> {
  const tables = [
    'match_reactions',
    'match_comments',
    'tournament_posts',
    'notifications',
    'payments',
    'promo_codes',
    'payment_plans',
    'checkin_qr_codes',
    'match_checkins',
    'player_statistics',
    'standings',
    'match_events',
    'match_sets',
    'matches',
    'team_players',
    'teams',
    'tournaments',
    'venues',
    'refresh_tokens',
    'users',
  ] as const;

  for (const table of tables) {
    await db.deleteFrom(table).execute();
  }
}

/**
 * Destroy the test database connection.
 */
export async function destroyTestDb(): Promise<void> {
  if (testDb) {
    await testDb.destroy();
    testDb = null;
  }
}
