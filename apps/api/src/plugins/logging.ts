import type { ApolloServerPlugin } from '@apollo/server';
import { logger } from '../lib/logger.js';
import type { GraphQLContext } from '../context.js';

export const loggingPlugin: ApolloServerPlugin<GraphQLContext> = {
  async requestDidStart(requestContext) {
    const start = Date.now();
    const operationName = requestContext.request.operationName ?? 'anonymous';

    return {
      async willSendResponse() {
        const duration = Date.now() - start;
        logger.info({ operationName, duration }, 'GraphQL request');
      },
    };
  },
};
