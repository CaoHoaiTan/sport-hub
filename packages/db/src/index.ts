import { Kysely } from 'kysely';
import { createDialect } from './config.js';
import type { Database } from './database.js';

export type { Database } from './database.js';
export * from './database.js';

let db: Kysely<Database> | null = null;

export function getDb(connectionString?: string): Kysely<Database> {
  if (!db) {
    db = new Kysely<Database>({
      dialect: createDialect(connectionString),
    });
  }
  return db;
}

export function createDb(connectionString?: string): Kysely<Database> {
  return new Kysely<Database>({
    dialect: createDialect(connectionString),
  });
}
