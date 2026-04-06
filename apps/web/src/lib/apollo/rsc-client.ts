import { HttpLink } from '@apollo/client';
import {
  registerApolloClient,
  ApolloClient,
  InMemoryCache,
} from '@apollo/experimental-nextjs-app-support';

import { GRAPHQL_HTTP_URL } from '@/lib/constants';

export const { getClient } = registerApolloClient(() => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: GRAPHQL_HTTP_URL,
      fetchOptions: { cache: 'no-store' },
    }),
  });
});
