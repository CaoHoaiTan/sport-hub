import { Redis } from 'ioredis';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
    const isTLS = url.startsWith('rediss://');

    redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      ...(isTLS && { tls: { rejectUnauthorized: false } }),
    });
  }
  return redis;
}
