'use client';

import type { ReactNode } from 'react';

import { useAuth } from '@/lib/auth/context';
import { hasRole, type UserRole } from '@/lib/utils/roles';

interface RoleGateProps {
  roles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGate({ roles, children, fallback = null }: RoleGateProps) {
  const { user } = useAuth();

  if (!user || !hasRole(user.role, roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
