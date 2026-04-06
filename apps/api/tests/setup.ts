import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });

/**
 * Vitest globalSetup: runs once before all test files.
 * Uses the existing database and applies migrations if needed.
 */
export async function setup(): Promise<void> {
  // Ensure test environment uses test database
  const dbUrl = process.env.DATABASE_URL ?? 'postgresql://sporthub:sporthub_dev@localhost:5432/sporthub_test';
  process.env.DATABASE_URL = dbUrl;
}

export async function teardown(): Promise<void> {
  // Cleanup is handled per-test in helpers
}
