import type { Kysely } from 'kysely';
import type { Database } from '@sporthub/db';
import { logger } from '../lib/logger.js';

/**
 * Hourly check for overdue payments.
 * Mark pending payments that have passed their expires_at as overdue.
 */
export async function processPaymentExpiry(db: Kysely<Database>): Promise<void> {
  const now = new Date();

  try {
    const result = await db
      .updateTable('payments')
      .set({ status: 'overdue', updated_at: new Date() })
      .where('status', '=', 'pending')
      .where('expires_at', 'is not', null)
      .where('expires_at', '<', now)
      .returningAll()
      .execute();

    if (result.length > 0) {
      logger.info(
        { count: result.length },
        'Marked overdue payments'
      );
    }
  } catch (error: unknown) {
    logger.error({ error }, 'Failed to process payment expiry');
  }
}
