import { GraphQLError } from 'graphql';
import { z } from 'zod';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { Database, Venue } from '@sporthub/db';

const createVenueSchema = z.object({
  name: z.string().min(1).max(255),
  address: z.string().max(1000).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  capacity: z.number().int().min(0).nullable().optional(),
  sportTypes: z.array(z.enum(['football', 'volleyball', 'badminton'])).nullable().optional(),
  surfaceType: z.string().max(50).nullable().optional(),
  amenities: z.array(z.string()).nullable().optional(),
  contactInfo: z.record(z.unknown()).nullable().optional(),
});

const updateVenueSchema = createVenueSchema.partial();

export class VenueService {
  constructor(private db: Kysely<Database>) {}

  async create(createdBy: string, input: unknown): Promise<Venue> {
    const data = createVenueSchema.parse(input);

    return this.db
      .insertInto('venues')
      .values({
        name: data.name,
        address: data.address ?? null,
        city: data.city ?? null,
        latitude: data.latitude != null ? String(data.latitude) : null,
        longitude: data.longitude != null ? String(data.longitude) : null,
        capacity: data.capacity ?? null,
        sport_types: data.sportTypes ?? null,
        surface_type: data.surfaceType ?? null,
        amenities: data.amenities ?? null,
        contact_info: data.contactInfo ?? null,
        created_by: createdBy,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async update(
    id: string,
    userId: string,
    userRole: string,
    input: unknown
  ): Promise<Venue> {
    const data = updateVenueSchema.parse(input);
    const venue = await this.getById(id);

    if (!venue) {
      throw new GraphQLError('Venue not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    if (venue.created_by !== userId && userRole !== 'admin') {
      throw new GraphQLError('Not authorized', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    const updateData: Record<string, unknown> = { updated_at: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.latitude !== undefined) updateData.latitude = data.latitude != null ? String(data.latitude) : null;
    if (data.longitude !== undefined) updateData.longitude = data.longitude != null ? String(data.longitude) : null;
    if (data.capacity !== undefined) updateData.capacity = data.capacity;
    if (data.sportTypes !== undefined) updateData.sport_types = data.sportTypes;
    if (data.surfaceType !== undefined) updateData.surface_type = data.surfaceType;
    if (data.amenities !== undefined) updateData.amenities = data.amenities;
    if (data.contactInfo !== undefined) updateData.contact_info = data.contactInfo ? JSON.stringify(data.contactInfo) : null;

    return this.db
      .updateTable('venues')
      .set(updateData)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async delete(id: string, userId: string, userRole: string): Promise<boolean> {
    const venue = await this.getById(id);

    if (!venue) {
      throw new GraphQLError('Venue not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    if (venue.created_by !== userId && userRole !== 'admin') {
      throw new GraphQLError('Not authorized', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    await this.db.deleteFrom('venues').where('id', '=', id).execute();
    return true;
  }

  async getById(id: string): Promise<Venue | undefined> {
    return this.db
      .selectFrom('venues')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async list(city?: string, sportType?: string): Promise<Venue[]> {
    let query = this.db
      .selectFrom('venues')
      .selectAll()
      .orderBy('name', 'asc');

    if (city) {
      query = query.where('city', 'ilike', `%${city}%`);
    }

    if (sportType) {
      const validSports = ['football', 'volleyball', 'badminton'];
      if (!validSports.includes(sportType)) {
        throw new GraphQLError('Invalid sport type', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      query = query.where(sql`${sql.lit(sportType)} = ANY(sport_types)` as never);
    }

    return query.execute();
  }
}
