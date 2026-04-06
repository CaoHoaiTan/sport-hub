'use client';

import { ApolloNextAppProvider } from '@apollo/experimental-nextjs-app-support';

import { makeClient } from './client';

export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}
