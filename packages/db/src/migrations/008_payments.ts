import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'overdue', 'refunded', 'cancelled')`.execute(db);
  await sql`CREATE TYPE payment_method AS ENUM ('bank_transfer', 'momo', 'vnpay', 'zalopay', 'cash')`.execute(db);

  await db.schema
    .createTable('payment_plans')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('tournament_id', 'uuid', (col) =>
      col.notNull().references('tournaments.id').onDelete('cascade')
    )
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('amount', 'decimal(12, 2)', (col) => col.notNull())
    .addColumn('currency', 'varchar(3)', (col) =>
      col.notNull().defaultTo('VND')
    )
    .addColumn('per_team', 'boolean', (col) =>
      col.notNull().defaultTo(true)
    )
    .addColumn('early_bird_amount', 'decimal(12, 2)')
    .addColumn('early_bird_deadline', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`)
    )
    .execute();

  await db.schema
    .createTable('payments')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('payment_plan_id', 'uuid', (col) =>
      col.notNull().references('payment_plans.id')
    )
    .addColumn('team_id', 'uuid', (col) =>
      col.notNull().references('teams.id')
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id')
    )
    .addColumn('amount', 'decimal(12, 2)', (col) => col.notNull())
    .addColumn('currency', 'varchar(3)', (col) =>
      col.notNull().defaultTo('VND')
    )
    .addColumn('status', sql`payment_status`, (col) =>
      col.notNull().defaultTo('pending')
    )
    .addColumn('method', sql`payment_method`)
    .addColumn('transaction_id', 'varchar(255)')
    .addColumn('gateway_response', 'jsonb')
    .addColumn('payment_url', 'text')
    .addColumn('promo_code', 'varchar(50)')
    .addColumn('discount_amount', 'decimal(12, 2)', (col) =>
      col.notNull().defaultTo(0)
    )
    .addColumn('refunded_at', 'timestamptz')
    .addColumn('refund_reason', 'text')
    .addColumn('paid_at', 'timestamptz')
    .addColumn('expires_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`)
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`)
    )
    .execute();

  await db.schema
    .createIndex('idx_payments_team')
    .on('payments')
    .column('team_id')
    .execute();

  await db.schema
    .createIndex('idx_payments_status')
    .on('payments')
    .column('status')
    .execute();

  await db.schema
    .createTable('promo_codes')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('tournament_id', 'uuid', (col) =>
      col.notNull().references('tournaments.id').onDelete('cascade')
    )
    .addColumn('code', 'varchar(50)', (col) => col.notNull().unique())
    .addColumn('discount_type', 'varchar(10)', (col) => col.notNull())
    .addColumn('discount_value', 'decimal(12, 2)', (col) => col.notNull())
    .addColumn('max_uses', 'integer')
    .addColumn('used_count', 'integer', (col) =>
      col.notNull().defaultTo(0)
    )
    .addColumn('valid_from', 'timestamptz')
    .addColumn('valid_until', 'timestamptz')
    .addColumn('is_active', 'boolean', (col) =>
      col.notNull().defaultTo(true)
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`)
    )
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('promo_codes').execute();
  await db.schema.dropTable('payments').execute();
  await db.schema.dropTable('payment_plans').execute();
  await sql`DROP TYPE IF EXISTS payment_method`.execute(db);
  await sql`DROP TYPE IF EXISTS payment_status`.execute(db);
}
