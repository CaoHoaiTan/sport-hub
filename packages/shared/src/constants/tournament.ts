export const TournamentFormat = {
  ROUND_ROBIN: 'round_robin',
  SINGLE_ELIMINATION: 'single_elimination',
  DOUBLE_ELIMINATION: 'double_elimination',
  GROUP_STAGE_KNOCKOUT: 'group_stage_knockout',
} as const;

export type TournamentFormat = (typeof TournamentFormat)[keyof typeof TournamentFormat];

export const TournamentStatus = {
  DRAFT: 'draft',
  REGISTRATION: 'registration',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type TournamentStatus = (typeof TournamentStatus)[keyof typeof TournamentStatus];

/** Valid state transitions for tournament lifecycle */
export const TOURNAMENT_TRANSITIONS: Record<TournamentStatus, TournamentStatus[]> = {
  draft: ['registration', 'cancelled'],
  registration: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};
