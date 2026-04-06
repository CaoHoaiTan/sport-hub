import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('standings')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('tournament_id', 'uuid', (col) =>
      col.notNull().references('tournaments.id').onDelete('cascade')
    )
    .addColumn('team_id', 'uuid', (col) =>
      col.notNull().references('teams.id').onDelete('cascade')
    )
    .addColumn('group_name', 'varchar(10)')
    .addColumn('played', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('won', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('drawn', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('lost', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('goals_for', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('goals_against', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('goal_difference', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('points', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('sets_won', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('sets_lost', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('rank', 'integer')
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`)
    )
    .execute();

  await db.schema
    .createIndex('uq_standings_tournament_team')
    .on('standings')
    .columns(['tournament_id', 'team_id'])
    .unique()
    .execute();

  await db.schema
    .createIndex('idx_standings_tournament')
    .on('standings')
    .column('tournament_id')
    .execute();

  await db.schema
    .createTable('player_statistics')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('tournament_id', 'uuid', (col) =>
      col.notNull().references('tournaments.id').onDelete('cascade')
    )
    .addColumn('player_id', 'uuid', (col) =>
      col.notNull().references('team_players.id').onDelete('cascade')
    )
    .addColumn('team_id', 'uuid', (col) =>
      col.notNull().references('teams.id').onDelete('cascade')
    )
    .addColumn('goals', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('assists', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('yellow_cards', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('red_cards', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('points_scored', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('aces', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('matches_played', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('mvp_count', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`)
    )
    .execute();

  await db.schema
    .createIndex('uq_player_statistics_tournament_player')
    .on('player_statistics')
    .columns(['tournament_id', 'player_id'])
    .unique()
    .execute();

  await db.schema
    .createIndex('idx_player_statistics_tournament')
    .on('player_statistics')
    .column('tournament_id')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('player_statistics').execute();
  await db.schema.dropTable('standings').execute();
}
