export const SportType = {
  FOOTBALL: 'football',
  VOLLEYBALL: 'volleyball',
  BADMINTON: 'badminton',
} as const;

export type SportType = (typeof SportType)[keyof typeof SportType];

export interface SportRules {
  minPlayersPerTeam: { min: number; max: number };
  maxPlayersPerTeam: { min: number; max: number };
  scoring: {
    type: 'single_score' | 'sets';
    setsToWin?: number;
    pointsPerSet?: number;
    finalSetPoints?: number;
    minPointLead: number;
    maxPoints?: number;
  };
}

export const SPORT_RULES: Record<SportType, SportRules> = {
  football: {
    minPlayersPerTeam: { min: 5, max: 11 },
    maxPlayersPerTeam: { min: 11, max: 25 },
    scoring: {
      type: 'single_score',
      minPointLead: 0,
    },
  },
  volleyball: {
    minPlayersPerTeam: { min: 6, max: 6 },
    maxPlayersPerTeam: { min: 6, max: 14 },
    scoring: {
      type: 'sets',
      setsToWin: 3,
      pointsPerSet: 25,
      finalSetPoints: 15,
      minPointLead: 2,
    },
  },
  badminton: {
    minPlayersPerTeam: { min: 1, max: 2 },
    maxPlayersPerTeam: { min: 2, max: 4 },
    scoring: {
      type: 'sets',
      setsToWin: 2,
      pointsPerSet: 21,
      minPointLead: 2,
      maxPoints: 30,
    },
  },
};
