import type { ApolloServerPlugin } from '@apollo/server';
import { logger } from '../lib/logger.js';
import type { GraphQLContext } from '../context.js';

export const errorHandlerPlugin: ApolloServerPlugin<GraphQLContext> = {
  async requestDidStart() {
    return {
      async didEncounterErrors(ctx) {
        for (const err of ctx.errors) {
          if (err.extensions?.code === 'INTERNAL_SERVER_ERROR') {
            logger.error({ err: err.originalError ?? err }, 'GraphQL internal error');
          }
        }
      },
    };
  },
};
