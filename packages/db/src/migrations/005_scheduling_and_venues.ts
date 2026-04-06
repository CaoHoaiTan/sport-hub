import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('venues')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('address', 'text')
    .addColumn('city', 'varchar(100)')
    .addColumn('latitude', 'decimal(10, 8)')
    .addColumn('longitude', 'decimal(11, 8)')
    .addColumn('capacity', 'integer')
    .addColumn('sport_types', sql`sport_type[]`)
    .addColumn('surface_type', 'varchar(50)')
    .addColumn('amenities', sql`text[]`)
    .addColumn('contact_info', 'jsonb')
    .addColumn('created_by', 'uuid', (col) =>
      col.notNull().references('users.id')
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`)
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`)
    )
    .execute();

  // Add FK from matches.venue_id to venues.id
  await sql`
    ALTER TABLE matches
    ADD CONSTRAINT fk_matches_venue
    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`ALTER TABLE matches DROP CONSTRAINT IF EXISTS fk_matches_venue`.execute(db);
  await db.schema.dropTable('venues').execute();
}
