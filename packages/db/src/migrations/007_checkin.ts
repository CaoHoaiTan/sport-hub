import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`CREATE TYPE checkin_status AS ENUM ('pending', 'checked_in', 'absent')`.execute(db);

  await db.schema
    .createTable('match_checkins')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('match_id', 'uuid', (col) =>
      col.notNull().references('matches.id').onDelete('cascade')
    )
    .addColumn('team_id', 'uuid', (col) =>
      col.notNull().references('teams.id')
    )
    .addColumn('player_id', 'uuid', (col) =>
      col.notNull().references('team_players.id')
    )
    .addColumn('status', sql`checkin_status`, (col) =>
      col.notNull().defaultTo('pending')
    )
    .addColumn('checked_in_at', 'timestamptz')
    .addColumn('method', 'varchar(20)')
    .addColumn('checked_in_by', 'uuid', (col) =>
      col.references('users.id')
    )
    .addColumn('is_starting', 'boolean', (col) =>
      col.notNull().defaultTo(false)
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`)
    )
    .execute();

  await db.schema
    .createIndex('uq_match_checkins_match_player')
    .on('match_checkins')
    .columns(['match_id', 'player_id'])
    .unique()
    .execute();

  await db.schema
    .createIndex('idx_match_checkins_match')
    .on('match_checkins')
    .column('match_id')
    .execute();

  await db.schema
    .createTable('checkin_qr_codes')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('match_id', 'uuid', (col) =>
      col.notNull().references('matches.id').onDelete('cascade')
    )
    .addColumn('code', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('expires_at', 'timestamptz', (col) => col.notNull())
    .addColumn('is_used', 'boolean', (col) =>
      col.notNull().defaultTo(false)
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`)
    )
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('checkin_qr_codes').execute();
  await db.schema.dropTable('match_checkins').execute();
  await sql`DROP TYPE IF EXISTS checkin_status`.execute(db);
}
