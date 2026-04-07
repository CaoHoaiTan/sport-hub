import type { Kysely } from 'kysely';
import type { Database } from '../database.js';

/**
 * Seed demo users with different roles.
 * Password for all: "Password@123"
 * bcrypt hash with 12 rounds
 */
const PASSWORD_HASH =
  '$2b$12$qVeKJxWcg5mmgZKGtDlfn.q56d3FqZ9m91Dj5/h0leBtYEtydHiNO';

const users = [
  { email: 'admin@sporthub.vn', full_name: 'Nguyễn Văn Admin', role: 'admin' as const },
  { email: 'btc.nam@sporthub.vn', full_name: 'Trần Minh Nam', role: 'organizer' as const },
  { email: 'btc.linh@sporthub.vn', full_name: 'Lê Thị Linh', role: 'organizer' as const },
  { email: 'ql.hung@sporthub.vn', full_name: 'Phạm Đức Hùng', role: 'team_manager' as const },
  { email: 'ql.thao@sporthub.vn', full_name: 'Võ Thanh Thảo', role: 'team_manager' as const },
  { email: 'ql.duc@sporthub.vn', full_name: 'Hoàng Văn Đức', role: 'team_manager' as const },
  { email: 'ql.mai@sporthub.vn', full_name: 'Ngô Thị Mai', role: 'team_manager' as const },
  { email: 'ql.tuan@sporthub.vn', full_name: 'Bùi Anh Tuấn', role: 'team_manager' as const },
  { email: 'ql.hoa@sporthub.vn', full_name: 'Đặng Thị Hoa', role: 'team_manager' as const },
  { email: 'trongtai@sporthub.vn', full_name: 'Lý Văn Trọng', role: 'referee' as const },
  { email: 'player1@sporthub.vn', full_name: 'Nguyễn Công Phượng', role: 'player' as const },
  { email: 'player2@sporthub.vn', full_name: 'Quang Hải', role: 'player' as const },
];

export async function seed(db: Kysely<Database>): Promise<void> {
  for (const u of users) {
    const existing = await db
      .selectFrom('users')
      .select('id')
      .where('email', '=', u.email)
      .executeTakeFirst();

    if (!existing) {
      await db
        .insertInto('users')
        .values({
          email: u.email,
          password_hash: PASSWORD_HASH,
          full_name: u.full_name,
          role: u.role,
          is_active: true,
          email_verified: true,
        })
        .execute();
    }
  }

  console.log(`Seeded ${users.length} users (password: Password@123)`);
}
