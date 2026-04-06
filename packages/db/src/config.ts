import { PostgresDialect } from 'kysely';
import pg from 'pg';

const { Pool } = pg;

export function createDialect(connectionString?: string): PostgresDialect {
  return new PostgresDialect({
    pool: new Pool({
      connectionString: connectionString ?? process.env.DATABASE_URL,
      max: 10,
    }),
  });
}
