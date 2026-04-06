import { GraphQLError } from 'graphql';
import { z } from 'zod';
import crypto from 'node:crypto';
import type { Kysely } from 'kysely';
import type { Database, User } from '@sporthub/db';
import type Redis from 'ioredis';
import { hashPassword, comparePassword } from '../../lib/password.js';
import { signAccessToken, signRefreshToken, verifyToken } from '../../lib/jwt.js';

// ─── Validation Schemas ──────────────────────────────────
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  fullName: z.string().min(1).max(255),
  phone: z.string().max(20).nullable().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── Types ───────────────────────────────────────────────
interface AuthPayload {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// ─── Service ─────────────────────────────────────────────
export class AuthService {
  constructor(
    private db: Kysely<Database>,
    private redis: Redis
  ) {}

  async register(input: unknown): Promise<AuthPayload> {
    const data = registerSchema.parse(input);

    // Check if email already exists
    const existing = await this.db
      .selectFrom('users')
      .select('id')
      .where('email', '=', data.email)
      .executeTakeFirst();

    if (existing) {
      throw new GraphQLError('Email already registered', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    const passwordHash = await hashPassword(data.password);

    const user = await this.db
      .insertInto('users')
      .values({
        email: data.email,
        password_hash: passwordHash,
        full_name: data.fullName,
        phone: data.phone ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.generateTokens(user);
  }

  async login(input: unknown): Promise<AuthPayload> {
    const data = loginSchema.parse(input);

    const user = await this.db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', data.email)
      .where('is_active', '=', true)
      .executeTakeFirst();

    if (!user) {
      throw new GraphQLError('Invalid email or password', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    const valid = await comparePassword(data.password, user.password_hash);
    if (!valid) {
      throw new GraphQLError('Invalid email or password', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    return this.generateTokens(user);
  }

  async refreshToken(token: string): Promise<AuthPayload> {
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new GraphQLError('Invalid refresh token', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const tokenHash = this.hashToken(token);

    // Find valid (non-revoked) refresh token
    const stored = await this.db
      .selectFrom('refresh_tokens')
      .selectAll()
      .where('token_hash', '=', tokenHash)
      .where('revoked', '=', false)
      .where('user_id', '=', payload.userId)
      .executeTakeFirst();

    if (!stored) {
      throw new GraphQLError('Invalid refresh token', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // Revoke old token
    await this.db
      .updateTable('refresh_tokens')
      .set({ revoked: true })
      .where('id', '=', stored.id)
      .execute();

    const user = await this.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', payload.userId)
      .where('is_active', '=', true)
      .executeTakeFirstOrThrow();

    return this.generateTokens(user);
  }

  async logout(userId: string): Promise<boolean> {
    // Revoke all refresh tokens for this user
    await this.db
      .updateTable('refresh_tokens')
      .set({ revoked: true })
      .where('user_id', '=', userId)
      .where('revoked', '=', false)
      .execute();

    return true;
  }

  async forgotPassword(email: string): Promise<boolean> {
    const user = await this.db
      .selectFrom('users')
      .select('id')
      .where('email', '=', email)
      .where('is_active', '=', true)
      .executeTakeFirst();

    // Always return true to prevent email enumeration
    if (!user) return true;

    const resetToken = crypto.randomBytes(32).toString('hex');
    await this.redis.set(
      `password_reset:${resetToken}`,
      user.id,
      'EX',
      3600 // 1 hour
    );

    // TODO: Send email with reset link (Phase 9)
    return true;
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    if (newPassword.length < 8) {
      throw new GraphQLError('Password must be at least 8 characters', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    const userId = await this.redis.get(`password_reset:${token}`);
    if (!userId) {
      throw new GraphQLError('Invalid or expired reset token', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    const passwordHash = await hashPassword(newPassword);

    await this.db
      .updateTable('users')
      .set({ password_hash: passwordHash, updated_at: new Date() })
      .where('id', '=', userId)
      .execute();

    await this.redis.del(`password_reset:${token}`);

    // Revoke all refresh tokens
    await this.db
      .updateTable('refresh_tokens')
      .set({ revoked: true })
      .where('user_id', '=', userId)
      .execute();

    return true;
  }

  // ─── Helpers ─────────────────────────────────────────
  private async generateTokens(user: User): Promise<AuthPayload> {
    const tokenPayload = { userId: user.id, role: user.role };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    // Store refresh token hash
    await this.db
      .insertInto('refresh_tokens')
      .values({
        user_id: user.id,
        token_hash: this.hashToken(refreshToken),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      .execute();

    return { accessToken, refreshToken, user };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
