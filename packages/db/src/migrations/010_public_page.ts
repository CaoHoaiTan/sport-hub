import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('tournament_posts')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('tournament_id', 'uuid', (col) =>
      col.notNull().references('tournaments.id').onDelete('cascade')
    )
    .addColumn('author_id', 'uuid', (col) =>
      col.notNull().references('users.id')
    )
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('media_urls', sql`text[]`)
    .addColumn('is_pinned', 'boolean', (col) =>
      col.notNull().defaultTo(false)
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`)
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`)
    )
    .execute();

  await db.schema
    .createIndex('idx_tournament_posts_tournament')
    .on('tournament_posts')
    .column('tournament_id')
    .execute();

  await db.schema
    .createTable('match_comments')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('match_id', 'uuid', (col) =>
      col.notNull().references('matches.id').onDelete('cascade')
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.references('users.id')
    )
    .addColumn('guest_name', 'varchar(100)')
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('parent_id', 'uuid', (col) =>
      col.references('match_comments.id')
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`)
    )
    .execute();

  await db.schema
    .createIndex('idx_match_comments_match')
    .on('match_comments')
    .column('match_id')
    .execute();

  await db.schema
    .createTable('match_reactions')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('match_id', 'uuid', (col) =>
      col.notNull().references('matches.id').onDelete('cascade')
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id')
    )
    .addColumn('reaction', 'varchar(20)', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`)
    )
    .execute();

  await db.schema
    .createIndex('uq_match_reactions_match_user_reaction')
    .on('match_reactions')
    .columns(['match_id', 'user_id', 'reaction'])
    .unique()
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('match_reactions').execute();
  await db.schema.dropTable('match_comments').execute();
  await db.schema.dropTable('tournament_posts').execute();
}
