import type { GraphQLContext } from '../../context.js';
import { requireAuth } from '../../middleware/role.guard.js';
import { AuthService } from './auth.service.js';

export const authResolvers = {
  Mutation: {
    register: async (
      _: unknown,
      { input }: { input: unknown },
      ctx: GraphQLContext
    ) => {
      const service = new AuthService(ctx.db, ctx.redis);
      return service.register(input);
    },

    login: async (
      _: unknown,
      { input }: { input: unknown },
      ctx: GraphQLContext
    ) => {
      const service = new AuthService(ctx.db, ctx.redis);
      return service.login(input);
    },

    refreshToken: async (
      _: unknown,
      { token }: { token: string },
      ctx: GraphQLContext
    ) => {
      const service = new AuthService(ctx.db, ctx.redis);
      return service.refreshToken(token);
    },

    logout: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const user = requireAuth(ctx.user);
      const service = new AuthService(ctx.db, ctx.redis);
      return service.logout(user.id);
    },

    forgotPassword: async (
      _: unknown,
      { email }: { email: string },
      ctx: GraphQLContext
    ) => {
      const service = new AuthService(ctx.db, ctx.redis);
      return service.forgotPassword(email);
    },

    resetPassword: async (
      _: unknown,
      { input }: { input: { token: string; newPassword: string } },
      ctx: GraphQLContext
    ) => {
      const service = new AuthService(ctx.db, ctx.redis);
      return service.resetPassword(input.token, input.newPassword);
    },
  },
};
