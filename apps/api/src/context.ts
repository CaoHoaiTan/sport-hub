import type { Kysely } from 'kysely';
import type { Database, User } from '@sporthub/db';
import type Redis from 'ioredis';
import type { Loaders } from './lib/loaders.js';

export interface GraphQLContext {
  db: Kysely<Database>;
  redis: Redis;
  user: User | null;
  loaders: Loaders;
  clientIp: string;
}
