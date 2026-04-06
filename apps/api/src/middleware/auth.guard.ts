import type { Kysely } from 'kysely';
import type { Database, User } from '@sporthub/db';
import { verifyToken } from '../lib/jwt.js';

/**
 * Extract and verify JWT from Authorization header.
 * Returns the user if valid, null otherwise.
 */
export async function authenticateUser(
  authorization: string | undefined,
  db: Kysely<Database>
): Promise<User | null> {
  if (!authorization) return null;

  const token = authorization.startsWith('Bearer ')
    ? authorization.slice(7)
    : null;

  if (!token) return null;

  try {
    const payload = verifyToken(token);
    const user = await db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', payload.userId)
      .where('is_active', '=', true)
      .executeTakeFirst();

    return user ?? null;
  } catch {
    return null;
  }
}
