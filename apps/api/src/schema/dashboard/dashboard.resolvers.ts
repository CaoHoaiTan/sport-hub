import { JSONResolver } from 'graphql-scalars';
import type { GraphQLContext } from '../../context.js';
import { requireAuth, requireRole } from '../../middleware/role.guard.js';
import { DashboardService } from './dashboard.service.js';

export const dashboardResolvers = {
  JSON: JSONResolver,

  Query: {
    organizerDashboard: async (
      _: unknown,
      __: unknown,
      ctx: GraphQLContext
    ) => {
      const user = requireRole(ctx.user, 'organizer', 'admin');
      const service = new DashboardService(ctx.db);
      return service.getOrganizerDashboard(user.id);
    },

    adminDashboard: async (
      _: unknown,
      __: unknown,
      ctx: GraphQLContext
    ) => {
      requireRole(ctx.user, 'admin');
      const service = new DashboardService(ctx.db);
      return service.getAdminDashboard();
    },

    playerDashboard: async (
      _: unknown,
      __: unknown,
      ctx: GraphQLContext
    ) => {
      const user = requireAuth(ctx.user);
      const service = new DashboardService(ctx.db);
      return service.getPlayerDashboard(user.id);
    },

    exportTournamentReport: async (
      _: unknown,
      { tournamentId }: { tournamentId: string },
      ctx: GraphQLContext
    ) => {
      const user = requireRole(ctx.user, 'organizer', 'admin');
      const service = new DashboardService(ctx.db);
      return service.exportTournamentReport(tournamentId, user.id);
    },

    exportFinancialReport: async (
      _: unknown,
      { tournamentId }: { tournamentId: string },
      ctx: GraphQLContext
    ) => {
      const user = requireRole(ctx.user, 'organizer', 'admin');
      const service = new DashboardService(ctx.db);
      return service.exportFinancialReport(tournamentId, user.id);
    },
  },
};
