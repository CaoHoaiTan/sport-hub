import type { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('payment_plans')
    .addColumn('bank_name', 'varchar(255)')
    .execute();

  await db.schema
    .alterTable('payment_plans')
    .addColumn('bank_account_number', 'varchar(50)')
    .execute();

  await db.schema
    .alterTable('payment_plans')
    .addColumn('bank_account_holder', 'varchar(255)')
    .execute();

  await db.schema
    .alterTable('payment_plans')
    .addColumn('transfer_content', 'varchar(500)')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('payment_plans').dropColumn('transfer_content').execute();
  await db.schema.alterTable('payment_plans').dropColumn('bank_account_holder').execute();
  await db.schema.alterTable('payment_plans').dropColumn('bank_account_number').execute();
  await db.schema.alterTable('payment_plans').dropColumn('bank_name').execute();
}
