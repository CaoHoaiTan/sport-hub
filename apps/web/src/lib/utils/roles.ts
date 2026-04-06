export type UserRole = 'admin' | 'organizer' | 'team_manager' | 'player' | 'referee';

export function hasRole(userRole: UserRole | undefined, allowedRoles: UserRole[]): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

export function isAdmin(role: UserRole | undefined): boolean {
  return role === 'admin';
}

export function isOrganizer(role: UserRole | undefined): boolean {
  return role === 'admin' || role === 'organizer';
}

export function canManageTeam(role: UserRole | undefined): boolean {
  return hasRole(role, ['admin', 'organizer', 'team_manager']);
}

export function canScoreMatch(role: UserRole | undefined): boolean {
  return hasRole(role, ['admin', 'organizer', 'referee']);
}
