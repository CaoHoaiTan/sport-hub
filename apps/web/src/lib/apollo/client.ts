import {
  from,
  split,
  ApolloLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { HttpLink } from '@apollo/client/link/http';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import {
  ApolloClient,
  InMemoryCache,
} from '@apollo/experimental-nextjs-app-support';

import { GRAPHQL_HTTP_URL, GRAPHQL_WS_URL } from '@/lib/constants';

import { getAccessToken, clearTokens } from '@/lib/auth/tokens';

const httpLink = new HttpLink({
  uri: GRAPHQL_HTTP_URL,
});

const authLink = setContext((_, { headers }) => {
  const token = getAccessToken();
  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
});

const errorLink = onError(({ graphQLErrors }) => {
  if (!graphQLErrors) return;

  const hasUnauthenticated = graphQLErrors.some(
    (err) =>
      err.extensions?.code === 'UNAUTHENTICATED' ||
      err.message === 'UNAUTHENTICATED'
  );

  if (!hasUnauthenticated) return;

  // On auth error, clear tokens and redirect to login
  clearTokens();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
});

function createWsLink() {
  if (typeof window === 'undefined') {
    return null;
  }

  return new GraphQLWsLink(
    createClient({
      url: GRAPHQL_WS_URL,
      connectionParams: () => {
        const token = getAccessToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
      retryAttempts: 5,
      shouldRetry: () => true,
    })
  );
}

function createLink(): ApolloLink {
  const authedHttpLink = from([errorLink, authLink, httpLink]);

  if (typeof window === 'undefined') {
    return authedHttpLink;
  }

  const wsLink = createWsLink();
  if (!wsLink) {
    return authedHttpLink;
  }

  return split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      );
    },
    wsLink,
    authedHttpLink
  );
}

export function makeClient(): ApolloClient<any> {
  return new ApolloClient({
    link: createLink(),
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            tournaments: {
              keyArgs: ['filter'],
              merge(existing, incoming) {
                if (!existing) return incoming;
                return {
                  ...incoming,
                  edges: [...existing.edges, ...incoming.edges],
                };
              },
            },
          },
        },
        Tournament: {
          keyFields: ['id'],
        },
        Team: {
          keyFields: ['id'],
        },
        Match: {
          keyFields: ['id'],
        },
        User: {
          keyFields: ['id'],
        },
        Standing: {
          keyFields: ['id'],
        },
        Payment: {
          keyFields: ['id'],
        },
        Venue: {
          keyFields: ['id'],
        },
        Notification: {
          keyFields: ['id'],
        },
      },
    }),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
      },
    },
  });
}
