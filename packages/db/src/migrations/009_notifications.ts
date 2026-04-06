import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`CREATE TYPE notification_type AS ENUM ('match_reminder', 'match_result', 'schedule_change', 'payment_reminder', 'registration', 'checkin', 'announcement', 'system')`.execute(db);

  await db.schema
    .createTable('notifications')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('type', sql`notification_type`, (col) => col.notNull())
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('body', 'text', (col) => col.notNull())
    .addColumn('data', 'jsonb')
    .addColumn('is_read', 'boolean', (col) =>
      col.notNull().defaultTo(false)
    )
    .addColumn('read_at', 'timestamptz')
    .addColumn('sent_email', 'boolean', (col) =>
      col.notNull().defaultTo(false)
    )
    .addColumn('sent_push', 'boolean', (col) =>
      col.notNull().defaultTo(false)
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`)
    )
    .execute();

  await db.schema
    .createIndex('idx_notifications_user')
    .on('notifications')
    .column('user_id')
    .execute();

  await db.schema
    .createIndex('idx_notifications_unread')
    .on('notifications')
    .columns(['user_id', 'is_read'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('notifications').execute();
  await sql`DROP TYPE IF EXISTS notification_type`.execute(db);
}
