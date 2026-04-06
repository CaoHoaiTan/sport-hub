export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  dashboard: '/dashboard',
  tournaments: '/tournaments',
  tournamentNew: '/tournaments/new',
  tournamentDetail: (id: string) => `/tournaments/${id}`,
  tournamentTeams: (id: string) => `/tournaments/${id}/teams`,
  tournamentSchedule: (id: string) => `/tournaments/${id}/schedule`,
  tournamentStandings: (id: string) => `/tournaments/${id}/standings`,
  tournamentCheckin: (id: string) => `/tournaments/${id}/checkin`,
  tournamentPayments: (id: string) => `/tournaments/${id}/payments`,
  tournamentPosts: (id: string) => `/tournaments/${id}/posts`,
  tournamentSettings: (id: string) => `/tournaments/${id}/settings`,
  matchDetail: (tournamentId: string, matchId: string) =>
    `/tournaments/${tournamentId}/matches/${matchId}`,
  teamDetail: (id: string) => `/teams/${id}`,
  teamPlayers: (id: string) => `/teams/${id}/players`,
  venues: '/venues',
  venueNew: '/venues/new',
  notifications: '/notifications',
  profile: '/profile',
  adminUsers: '/admin/users',
  adminReports: '/admin/reports',
  // Public routes
  publicTournaments: '/t',
  publicTournament: (slug: string) => `/t/${slug}`,
  publicSchedule: (slug: string) => `/t/${slug}/schedule`,
  publicStandings: (slug: string) => `/t/${slug}/standings`,
  publicMatch: (slug: string, matchId: string) => `/t/${slug}/matches/${matchId}`,
  publicPosts: (slug: string) => `/t/${slug}/posts`,
} as const;

export const GRAPHQL_HTTP_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_HTTP || 'http://localhost:4000/graphql';

export const GRAPHQL_WS_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_WS || 'ws://localhost:4000/graphql';
