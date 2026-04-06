import { GraphQLError } from 'graphql';
import type { User, UserRole } from '@sporthub/db';

/**
 * Require the user to be authenticated.
 * Throws UNAUTHENTICATED if no user in context.
 */
export function requireAuth(user: User | null): User {
  if (!user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return user;
}

/**
 * Require the user to have one of the specified roles.
 * Throws FORBIDDEN if role doesn't match.
 */
export function requireRole(user: User | null, ...roles: UserRole[]): User {
  const authedUser = requireAuth(user);
  if (!roles.includes(authedUser.role)) {
    throw new GraphQLError('Insufficient permissions', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
  return authedUser;
}
