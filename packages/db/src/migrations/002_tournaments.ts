import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`CREATE TYPE sport_type AS ENUM ('football', 'volleyball', 'badminton')`.execute(db);

  await sql`
    CREATE TYPE tournament_format AS ENUM (
      'round_robin',
      'single_elimination',
      'double_elimination',
      'group_stage_knockout'
    )
  `.execute(db);

  await sql`
    CREATE TYPE tournament_status AS ENUM (
      'draft',
      'registration',
      'in_progress',
      'completed',
      'cancelled'
    )
  `.execute(db);

  await db.schema
    .createTable('tournaments')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('slug', 'varchar(255)', (col) => col.unique().notNull())
    .addColumn('description', 'text')
    .addColumn('sport', sql`sport_type`, (col) => col.notNull())
    .addColumn('format', sql`tournament_format`, (col) => col.notNull())
    .addColumn('status', sql`tournament_status`, (col) => col.notNull().defaultTo('draft'))
    .addColumn('organizer_id', 'uuid', (col) => col.notNull().references('users.id'))
    .addColumn('max_teams', 'integer')
    .addColumn('min_players_per_team', 'integer', (col) => col.notNull())
    .addColumn('max_players_per_team', 'integer', (col) => col.notNull())
    .addColumn('group_count', 'integer')
    .addColumn('teams_per_group_advance', 'integer')
    .addColumn('registration_start', 'timestamptz')
    .addColumn('registration_end', 'timestamptz')
    .addColumn('start_date', 'timestamptz', (col) => col.notNull())
    .addColumn('end_date', 'timestamptz')
    .addColumn('points_for_win', 'integer', (col) => col.notNull().defaultTo(3))
    .addColumn('points_for_draw', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('points_for_loss', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('entry_fee', 'decimal(12, 2)', (col) => col.defaultTo(0))
    .addColumn('currency', 'varchar(3)', (col) => col.defaultTo('VND'))
    .addColumn('banner_url', 'text')
    .addColumn('rules_text', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema.createIndex('idx_tournaments_organizer').on('tournaments').column('organizer_id').execute();
  await db.schema.createIndex('idx_tournaments_sport').on('tournaments').column('sport').execute();
  await db.schema.createIndex('idx_tournaments_status').on('tournaments').column('status').execute();
  await db.schema.createIndex('idx_tournaments_slug').on('tournaments').column('slug').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('tournaments').execute();
  await sql`DROP TYPE IF EXISTS tournament_status`.execute(db);
  await sql`DROP TYPE IF EXISTS tournament_format`.execute(db);
  await sql`DROP TYPE IF EXISTS sport_type`.execute(db);
}
