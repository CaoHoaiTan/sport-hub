export const MatchStatus = {
  SCHEDULED: 'scheduled',
  CHECKIN_OPEN: 'checkin_open',
  LIVE: 'live',
  COMPLETED: 'completed',
  POSTPONED: 'postponed',
  CANCELLED: 'cancelled',
} as const;

export type MatchStatus = (typeof MatchStatus)[keyof typeof MatchStatus];

export const MatchEventType = {
  GOAL: 'goal',
  ASSIST: 'assist',
  YELLOW_CARD: 'yellow_card',
  RED_CARD: 'red_card',
  SUBSTITUTION: 'substitution',
  PENALTY: 'penalty',
  OWN_GOAL: 'own_goal',
  POINT: 'point',
} as const;

export type MatchEventType = (typeof MatchEventType)[keyof typeof MatchEventType];
