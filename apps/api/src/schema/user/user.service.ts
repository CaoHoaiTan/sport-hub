import { GraphQLError } from 'graphql';
import { z } from 'zod';
import type { Kysely } from 'kysely';
import type { Database, User } from '@sporthub/db';
import { hashPassword, comparePassword } from '../../lib/password.js';

const updateProfileSchema = z.object({
  fullName: z.string().min(1).max(255).optional(),
  phone: z.string().max(20).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export class UserService {
  constructor(private db: Kysely<Database>) {}

  async getProfile(userId: string): Promise<User | null> {
    const user = await this.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', userId)
      .executeTakeFirst();

    return user ?? null;
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await this.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', id)
      .where('is_active', '=', true)
      .executeTakeFirst();

    return user ?? null;
  }

  async updateProfile(userId: string, input: unknown): Promise<User> {
    const data = updateProfileSchema.parse(input);

    const updateData: Record<string, unknown> = { updated_at: new Date() };
    if (data.fullName !== undefined) updateData.full_name = data.fullName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;

    const user = await this.db
      .updateTable('users')
      .set(updateData)
      .where('id', '=', userId)
      .returningAll()
      .executeTakeFirstOrThrow();

    return user;
  }

  async changePassword(
    userId: string,
    input: unknown
  ): Promise<boolean> {
    const data = changePasswordSchema.parse(input);

    const user = await this.db
      .selectFrom('users')
      .select(['id', 'password_hash'])
      .where('id', '=', userId)
      .executeTakeFirstOrThrow();

    const valid = await comparePassword(data.currentPassword, user.password_hash);
    if (!valid) {
      throw new GraphQLError('Current password is incorrect', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    const newHash = await hashPassword(data.newPassword);

    await this.db
      .updateTable('users')
      .set({ password_hash: newHash, updated_at: new Date() })
      .where('id', '=', userId)
      .execute();

    return true;
  }

  async listUsers(pagination?: { first?: number; after?: string }) {
    const limit = Math.min(pagination?.first ?? 20, 100);
    let query = this.db
      .selectFrom('users')
      .selectAll()
      .where('is_active', '=', true)
      .orderBy('created_at', 'desc')
      .limit(limit + 1);

    if (pagination?.after) {
      const cursor = Buffer.from(pagination.after, 'base64').toString('utf-8');
      query = query.where('created_at', '<', new Date(cursor));
    }

    const rows = await query.execute();
    const hasNextPage = rows.length > limit;
    const edges = rows.slice(0, limit).map((user) => ({
      cursor: Buffer.from(user.created_at.toISOString()).toString('base64'),
      node: user,
    }));

    const totalCount = await this.db
      .selectFrom('users')
      .select(({ fn }) => fn.countAll<number>().as('count'))
      .where('is_active', '=', true)
      .executeTakeFirstOrThrow();

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage: !!pagination?.after,
        startCursor: edges[0]?.cursor ?? null,
        endCursor: edges[edges.length - 1]?.cursor ?? null,
      },
      totalCount: Number(totalCount.count),
    };
  }
}
