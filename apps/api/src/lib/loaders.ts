import DataLoader from 'dataloader';
import type { Kysely } from 'kysely';
import type { Database, User, Team } from '@sporthub/db';

export function createUserLoader(db: Kysely<Database>): DataLoader<string, User | null> {
  return new DataLoader<string, User | null>(async (ids) => {
    const users = await db
      .selectFrom('users')
      .selectAll()
      .where('id', 'in', [...ids])
      .execute();

    const userMap = new Map(users.map((u) => [u.id, u]));
    return ids.map((id) => userMap.get(id) ?? null);
  });
}

export function createTeamLoader(db: Kysely<Database>): DataLoader<string, Team | null> {
  return new DataLoader<string, Team | null>(async (ids) => {
    const teams = await db
      .selectFrom('teams')
      .selectAll()
      .where('id', 'in', [...ids])
      .execute();

    const teamMap = new Map(teams.map((t) => [t.id, t]));
    return ids.map((id) => teamMap.get(id) ?? null);
  });
}

export interface Loaders {
  userLoader: DataLoader<string, User | null>;
  teamLoader: DataLoader<string, Team | null>;
}

export function createLoaders(db: Kysely<Database>): Loaders {
  return {
    userLoader: createUserLoader(db),
    teamLoader: createTeamLoader(db),
  };
}
