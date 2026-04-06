import type { Kysely } from 'kysely';
import type { Database } from '../database.js';

export async function seed(db: Kysely<Database>): Promise<void> {
  const existing = await db
    .selectFrom('users')
    .select('id')
    .where('email', '=', 'admin@sporthub.vn')
    .executeTakeFirst();

  if (existing) {
    console.log('Admin user already exists, skipping');
    return;
  }

  // bcrypt hash of "Admin@123" with 12 rounds
  const passwordHash =
    '$2b$12$CHjo9Lu0yIC2HVCC1hWqA.JjizRQ/gfTedu5JkrLPadQED.BbdaVG';

  await db
    .insertInto('users')
    .values({
      email: 'admin@sporthub.vn',
      password_hash: passwordHash,
      full_name: 'System Admin',
      role: 'admin',
      is_active: true,
      email_verified: true,
    })
    .execute();

  console.log('Admin user created: admin@sporthub.vn / Admin@123');
}
