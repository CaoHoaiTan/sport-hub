import cron from 'node-cron';
import type { Kysely } from 'kysely';
import type { Database } from '@sporthub/db';
import { processCheckinWindows } from './checkin-window.js';
import { processPaymentExpiry } from './payment-expiry.js';
import { processMatchReminders } from './match-reminder.js';
import { logger } from '../lib/logger.js';

/**
 * Initialize all cron jobs.
 */
export function initializeScheduler(db: Kysely<Database>): void {
  // Check-in window: every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    logger.info('Running check-in window job');
    await processCheckinWindows(db);
  });

  // Payment expiry: every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    logger.info('Running payment expiry job');
    await processPaymentExpiry(db);
  });

  // Match reminders: every 10 minutes
  cron.schedule('*/10 * * * *', async () => {
    logger.info('Running match reminder job');
    await processMatchReminders(db);
  });

  logger.info('Scheduler initialized with cron jobs');
}
