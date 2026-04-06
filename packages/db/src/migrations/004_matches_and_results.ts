import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TYPE match_status AS ENUM (
      'scheduled',
      'checkin_open',
      'live',
      'completed',
      'postponed',
      'cancelled'
    )
  `.execute(db);

  await db.schema
    .createTable('matches')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('tournament_id', 'uuid', (col) =>
      col.notNull().references('tournaments.id').onDelete('cascade')
    )
    .addColumn('home_team_id', 'uuid', (col) =>
      col.references('teams.id').onDelete('set null')
    )
    .addColumn('away_team_id', 'uuid', (col) =>
      col.references('teams.id').onDelete('set null')
    )
    .addColumn('round', 'integer', (col) => col.notNull())
    .addColumn('round_name', 'varchar(100)')
    .addColumn('group_name', 'varchar(10)')
    .addColumn('bracket_position', 'integer')
    .addColumn('venue_id', 'uuid')
    .addColumn('scheduled_at', 'timestamptz')
    .addColumn('started_at', 'timestamptz')
    .addColumn('ended_at', 'timestamptz')
    .addColumn('status', sql`match_status`, (col) =>
      col.notNull().defaultTo('scheduled')
    )
    .addColumn('referee_id', 'uuid', (col) =>
      col.references('users.id').onDelete('set null')
    )
    .addColumn('home_score', 'integer')
    .addColumn('away_score', 'integer')
    .addColumn('winner_team_id', 'uuid', (col) =>
      col.references('teams.id').onDelete('set null')
    )
    .addColumn('is_draw', 'boolean')
    .addColumn('notes', 'text')
    .addColumn('postponed_reason', 'text')
    .addColumn('checkin_opens_at', 'timestamptz')
    .addColumn('checkin_deadline', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`)
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`)
    )
    .execute();

  await db.schema.createIndex('idx_matches_tournament').on('matches').column('tournament_id').execute();
  await db.schema.createIndex('idx_matches_home_team').on('matches').column('home_team_id').execute();
  await db.schema.createIndex('idx_matches_away_team').on('matches').column('away_team_id').execute();
  await db.schema.createIndex('idx_matches_scheduled_at').on('matches').column('scheduled_at').execute();
  await db.schema.createIndex('idx_matches_status').on('matches').column('status').execute();

  await db.schema
    .createTable('match_sets')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('match_id', 'uuid', (col) =>
      col.notNull().references('matches.id').onDelete('cascade')
    )
    .addColumn('set_number', 'integer', (col) => col.notNull())
    .addColumn('home_score', 'integer', (col) =>
      col.notNull().defaultTo(0)
    )
    .addColumn('away_score', 'integer', (col) =>
      col.notNull().defaultTo(0)
    )
    .execute();

  await db.schema
    .createIndex('uq_match_sets_match_set')
    .on('match_sets')
    .columns(['match_id', 'set_number'])
    .unique()
    .execute();

  await db.schema
    .createTable('match_events')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('match_id', 'uuid', (col) =>
      col.notNull().references('matches.id').onDelete('cascade')
    )
    .addColumn('team_id', 'uuid', (col) =>
      col.references('teams.id').onDelete('set null')
    )
    .addColumn('player_id', 'uuid', (col) =>
      col.references('team_players.id').onDelete('set null')
    )
    .addColumn('event_type', 'varchar(50)', (col) => col.notNull())
    .addColumn('minute', 'integer')
    .addColumn('set_number', 'integer')
    .addColumn('description', 'text')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`)
    )
    .execute();

  await db.schema.createIndex('idx_match_events_match').on('match_events').column('match_id').execute();
  await db.schema.createIndex('idx_match_events_player').on('match_events').column('player_id').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('match_events').execute();
  await db.schema.dropTable('match_sets').execute();
  await db.schema.dropTable('matches').execute();
  await sql`DROP TYPE IF EXISTS match_status`.execute(db);
}
