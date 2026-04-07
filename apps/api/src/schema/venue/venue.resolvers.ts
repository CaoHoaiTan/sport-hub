import type { Venue } from '@sporthub/db';
import type { GraphQLContext } from '../../context.js';
import { requireAuth, requireRole } from '../../middleware/role.guard.js';
import { VenueService } from './venue.service.js';

export const venueResolvers = {
  Query: {
    venue: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      const service = new VenueService(ctx.db);
      return service.getById(id) ?? null;
    },

    venues: async (
      _: unknown,
      { city, sportType }: { city?: string; sportType?: string },
      ctx: GraphQLContext
    ) => {
      const service = new VenueService(ctx.db);
      return service.list(city, sportType);
    },
  },

  Mutation: {
    createVenue: async (
      _: unknown,
      { input }: { input: unknown },
      ctx: GraphQLContext
    ) => {
      const user = requireRole(ctx.user, 'organizer', 'admin');
      const service = new VenueService(ctx.db);
      return service.create(user.id, input);
    },

    updateVenue: async (
      _: unknown,
      { id, input }: { id: string; input: unknown },
      ctx: GraphQLContext
    ) => {
      const user = requireAuth(ctx.user);
      const service = new VenueService(ctx.db);
      return service.update(id, user.id, user.role, input);
    },

    deleteVenue: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext
    ) => {
      const user = requireAuth(ctx.user);
      const service = new VenueService(ctx.db);
      return service.delete(id, user.id, user.role);
    },
  },

  Venue: {
    sportTypes: (v: Venue) => {
      if (!v.sport_types) return [];
      if (Array.isArray(v.sport_types)) return v.sport_types;
      // PostgreSQL may return "{football,volleyball}" as string
      const str = String(v.sport_types);
      return str.replace(/[{}]/g, '').split(',').filter(Boolean);
    },
    amenities: (v: Venue) => {
      if (!v.amenities) return [];
      if (Array.isArray(v.amenities)) return v.amenities;
      const str = String(v.amenities);
      return str.replace(/[{}]/g, '').split(',').filter(Boolean);
    },
    surfaceType: (v: Venue) => v.surface_type,
    contactInfo: (v: Venue) => v.contact_info,
    createdBy: (v: Venue) => v.created_by,
    createdAt: (v: Venue) => v.created_at,
    updatedAt: (v: Venue) => v.updated_at,
    latitude: (v: Venue) => v.latitude ? parseFloat(v.latitude) : null,
    longitude: (v: Venue) => v.longitude ? parseFloat(v.longitude) : null,
  },
};
