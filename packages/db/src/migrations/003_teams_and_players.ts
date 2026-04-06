import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('teams')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('tournament_id', 'uuid', (col) =>
      col.notNull().references('tournaments.id').onDelete('cascade')
    )
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('logo_url', 'text')
    .addColumn('manager_id', 'uuid', (col) =>
      col.notNull().references('users.id')
    )
    .addColumn('group_name', 'varchar(10)')
    .addColumn('seed', 'integer')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`)
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`)
    )
    .execute();

  await db.schema
    .createIndex('idx_teams_tournament')
    .on('teams')
    .column('tournament_id')
    .execute();

  await db.schema
    .createIndex('uq_teams_tournament_name')
    .on('teams')
    .columns(['tournament_id', 'name'])
    .unique()
    .execute();

  await db.schema
    .createTable('team_players')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('team_id', 'uuid', (col) =>
      col.notNull().references('teams.id').onDelete('cascade')
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.references('users.id').onDelete('set null')
    )
    .addColumn('full_name', 'varchar(255)', (col) => col.notNull())
    .addColumn('jersey_number', 'integer', (col) => col.notNull())
    .addColumn('position', 'varchar(50)')
    .addColumn('is_captain', 'boolean', (col) =>
      col.notNull().defaultTo(false)
    )
    .addColumn('is_active', 'boolean', (col) =>
      col.notNull().defaultTo(true)
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`)
    )
    .execute();

  await db.schema
    .createIndex('idx_team_players_team')
    .on('team_players')
    .column('team_id')
    .execute();

  await db.schema
    .createIndex('idx_team_players_user')
    .on('team_players')
    .column('user_id')
    .execute();

  await db.schema
    .createIndex('uq_team_players_team_jersey')
    .on('team_players')
    .columns(['team_id', 'jersey_number'])
    .unique()
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('team_players').execute();
  await db.schema.dropTable('teams').execute();
}
