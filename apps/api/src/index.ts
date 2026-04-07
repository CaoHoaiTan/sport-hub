import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { getDb } from '@sporthub/db';
import { getRedis } from './lib/redis.js';
import { logger } from './lib/logger.js';
import { errorHandlerPlugin } from './plugins/error-handler.js';
import { loggingPlugin } from './plugins/logging.js';
import { typeDefs, resolvers } from './schema/index.js';
import { authenticateUser } from './middleware/auth.guard.js';
import { createLoaders } from './lib/loaders.js';
import { apiRateLimiter, authRateLimiter } from './middleware/rate-limit.js';
import type { GraphQLContext } from './context.js';

// Startup env validation
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Required environment variable ${envVar} is not set`);
  }
}

const PORT = parseInt(process.env.PORT ?? '4000', 10);

async function start() {
  const app = express();
  const db = getDb();
  const redis = getRedis();

  const server = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    plugins: [errorHandlerPlugin, loggingPlugin],
  });

  await server.start();

  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    })
  );

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(apiRateLimiter);

  // Stricter rate limit for auth operations
  app.use('/graphql', (req, res, next) => {
    if (req.method === 'POST') {
      const body = req.body as { query?: string } | undefined;
      const query = body?.query ?? '';
      const isAuthOp = /mutation\s+\w*\s*\{?\s*(login|register|refreshToken|forgotPassword|resetPassword)\s*\(/i.test(query);
      if (isAuthOp) {
        return authRateLimiter(req, res, next);
      }
    }
    next();
  });

  app.use(
    '/graphql',
    cors<cors.CorsRequest>({
      origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'],
    }),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }): Promise<GraphQLContext> => {
        const user = await authenticateUser(req.headers.authorization, db);
        const loaders = createLoaders(db);
        return { db, redis, user, loaders };
      },
    })
  );

  await redis.connect();

  app.listen(PORT, () => {
    logger.info(`Server running at http://localhost:${PORT}/graphql`);
  });
}

start().catch((err) => {
  logger.error(err, 'Failed to start server');
  process.exit(1);
});
