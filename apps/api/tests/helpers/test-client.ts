import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import supertest from 'supertest';
import type { Kysely } from 'kysely';
import type { Database } from '@sporthub/db';
import { typeDefs, resolvers } from '../../src/schema/index.js';
import { authenticateUser } from '../../src/middleware/auth.guard.js';
import { createLoaders } from '../../src/lib/loaders.js';
import type { GraphQLContext } from '../../src/context.js';

interface TestClientOptions {
  db: Kysely<Database>;
  redis?: {
    get: () => Promise<string | null>;
    set: () => Promise<string>;
    del: () => Promise<number>;
    connect: () => Promise<void>;
  };
}

/**
 * Create a test GraphQL client that sends requests via supertest.
 */
export async function createTestClient(options: TestClientOptions) {
  const { db } = options;
  const app = express();

  // Minimal mock redis for tests
  const redis = (options.redis ?? {
    get: async () => null,
    set: async () => 'OK',
    del: async () => 1,
    connect: async () => {},
  }) as unknown as GraphQLContext['redis'];

  const server = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
  });

  await server.start();

  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }): Promise<GraphQLContext> => {
        const user = await authenticateUser(req.headers.authorization, db);
        const loaders = createLoaders(db);
        return { db, redis, user, loaders };
      },
    })
  );

  const request = supertest(app);

  return {
    request,
    server,
    /**
     * Execute a GraphQL query/mutation.
     */
    async execute(params: {
      query: string;
      variables?: Record<string, unknown>;
      token?: string;
    }) {
      const req = request.post('/graphql').send({
        query: params.query,
        variables: params.variables,
      });

      if (params.token) {
        req.set('Authorization', `Bearer ${params.token}`);
      }

      const response = await req;
      return {
        status: response.status,
        body: response.body as {
          data?: Record<string, unknown>;
          errors?: Array<{ message: string; extensions?: Record<string, unknown> }>;
        },
      };
    },

    async stop() {
      await server.stop();
    },
  };
}
