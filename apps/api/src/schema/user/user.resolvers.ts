import type { User } from '@sporthub/db';
import type { GraphQLContext } from '../../context.js';
import { requireAuth, requireRole } from '../../middleware/role.guard.js';
import { UserService } from './user.service.js';

export const userResolvers = {
  Query: {
    me: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      if (!ctx.user) return null;
      const service = new UserService(ctx.db);
      return service.getProfile(ctx.user.id);
    },

    user: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireAuth(ctx.user);
      const service = new UserService(ctx.db);
      return service.getUserById(id);
    },

    users: async (
      _: unknown,
      { pagination }: { pagination?: { first?: number; after?: string } },
      ctx: GraphQLContext
    ) => {
      requireRole(ctx.user, 'admin');
      const service = new UserService(ctx.db);
      return service.listUsers(pagination);
    },

    searchUsers: async (
      _: unknown,
      { query, limit }: { query: string; limit?: number },
      ctx: GraphQLContext
    ) => {
      requireAuth(ctx.user);
      const service = new UserService(ctx.db);
      return service.searchUsers(query, limit ?? 10);
    },
  },

  Mutation: {
    updateProfile: async (
      _: unknown,
      { input }: { input: unknown },
      ctx: GraphQLContext
    ) => {
      const user = requireAuth(ctx.user);
      const service = new UserService(ctx.db);
      return service.updateProfile(user.id, input);
    },

    changePassword: async (
      _: unknown,
      { input }: { input: unknown },
      ctx: GraphQLContext
    ) => {
      const user = requireAuth(ctx.user);
      const service = new UserService(ctx.db);
      return service.changePassword(user.id, input);
    },

    updateUserRole: async (
      _: unknown,
      { userId, role }: { userId: string; role: string },
      ctx: GraphQLContext
    ) => {
      const admin = requireRole(ctx.user, 'admin');
      const service = new UserService(ctx.db);
      return service.updateRole(userId, role, admin.id);
    },

    toggleUserActive: async (
      _: unknown,
      { userId }: { userId: string },
      ctx: GraphQLContext
    ) => {
      const admin = requireRole(ctx.user, 'admin');
      const service = new UserService(ctx.db);
      return service.toggleActive(userId, admin.id);
    },
  },

  User: {
    fullName: (user: User) => user.full_name,
    avatarUrl: (user: User) => user.avatar_url,
    isActive: (user: User) => user.is_active,
    emailVerified: (user: User) => user.email_verified,
    createdAt: (user: User) => user.created_at,
    updatedAt: (user: User) => user.updated_at,
  },
};
