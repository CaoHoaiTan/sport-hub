import { describe, it, expect } from 'vitest';
import { calculateStandings } from '../standings.js';
import type { MatchResult, StandingsConfig } from '../standings.js';

const defaultConfig: StandingsConfig = {
  pointsForWin: 3,
  pointsForDraw: 1,
  pointsForLoss: 0,
};

describe('calculateStandings', () => {
  it('returns correct initial standings with no matches', () => {
    const standings = calculateStandings(['t1', 't2', 't3'], [], defaultConfig);

    expect(standings).toHaveLength(3);
    for (const entry of standings) {
      expect(entry.played).toBe(0);
      expect(entry.won).toBe(0);
      expect(entry.drawn).toBe(0);
      expect(entry.lost).toBe(0);
      expect(entry.points).toBe(0);
      expect(entry.goalsFor).toBe(0);
      expect(entry.goalsAgainst).toBe(0);
      expect(entry.goalDifference).toBe(0);
    }
  });

  it('calculates points correctly for wins, draws, and losses', () => {
    const matches: MatchResult[] = [
      {
        homeTeamId: 't1',
        awayTeamId: 't2',
        homeScore: 2,
        awayScore: 0,
        groupName: null,
        isDraw: false,
        winnerTeamId: 't1',
      },
      {
        homeTeamId: 't2',
        awayTeamId: 't3',
        homeScore: 1,
        awayScore: 1,
        groupName: null,
        isDraw: true,
        winnerTeamId: null,
      },
      {
        homeTeamId: 't1',
        awayTeamId: 't3',
        homeScore: 3,
        awayScore: 1,
        groupName: null,
        isDraw: false,
        winnerTeamId: 't1',
      },
    ];

    const standings = calculateStandings(['t1', 't2', 't3'], matches, defaultConfig);

    // t1: 2W 0D 0L = 6 pts, GF=5, GA=1, GD=+4
    const t1 = standings.find((s) => s.teamId === 't1')!;
    expect(t1.won).toBe(2);
    expect(t1.drawn).toBe(0);
    expect(t1.lost).toBe(0);
    expect(t1.points).toBe(6);
    expect(t1.goalsFor).toBe(5);
    expect(t1.goalsAgainst).toBe(1);
    expect(t1.goalDifference).toBe(4);

    // t2: 0W 1D 1L = 1 pt, GF=1, GA=3, GD=-2
    const t2 = standings.find((s) => s.teamId === 't2')!;
    expect(t2.won).toBe(0);
    expect(t2.drawn).toBe(1);
    expect(t2.lost).toBe(1);
    expect(t2.points).toBe(1);
    expect(t2.goalsFor).toBe(1);
    expect(t2.goalsAgainst).toBe(3);
    expect(t2.goalDifference).toBe(-2);

    // t3: 0W 1D 1L = 1 pt, GF=2, GA=4, GD=-2
    const t3 = standings.find((s) => s.teamId === 't3')!;
    expect(t3.won).toBe(0);
    expect(t3.drawn).toBe(1);
    expect(t3.lost).toBe(1);
    expect(t3.points).toBe(1);
    expect(t3.goalsFor).toBe(2);
    expect(t3.goalsAgainst).toBe(4);
    expect(t3.goalDifference).toBe(-2);
  });

  it('ranks by points first, then goal difference', () => {
    const matches: MatchResult[] = [
      {
        homeTeamId: 't1',
        awayTeamId: 't2',
        homeScore: 3,
        awayScore: 0,
        groupName: null,
        isDraw: false,
        winnerTeamId: 't1',
      },
      {
        homeTeamId: 't3',
        awayTeamId: 't2',
        homeScore: 1,
        awayScore: 0,
        groupName: null,
        isDraw: false,
        winnerTeamId: 't3',
      },
    ];

    const standings = calculateStandings(['t1', 't2', 't3'], matches, defaultConfig);

    // t1 and t3 both have 3 pts, but t1 has better GD (+3 vs +1)
    expect(standings[0].teamId).toBe('t1');
    expect(standings[1].teamId).toBe('t3');
    expect(standings[2].teamId).toBe('t2');
  });

  it('assigns rank correctly', () => {
    const matches: MatchResult[] = [
      {
        homeTeamId: 't1',
        awayTeamId: 't2',
        homeScore: 1,
        awayScore: 0,
        groupName: null,
        isDraw: false,
        winnerTeamId: 't1',
      },
    ];

    const standings = calculateStandings(['t1', 't2'], matches, defaultConfig);

    expect(standings[0].rank).toBe(1);
    expect(standings[0].teamId).toBe('t1');
    expect(standings[1].rank).toBe(2);
    expect(standings[1].teamId).toBe('t2');
  });

  it('uses tiebreaker: goals scored when GD is tied', () => {
    const matches: MatchResult[] = [
      {
        homeTeamId: 't1',
        awayTeamId: 't3',
        homeScore: 3,
        awayScore: 1,
        groupName: null,
        isDraw: false,
        winnerTeamId: 't1',
      },
      {
        homeTeamId: 't2',
        awayTeamId: 't3',
        homeScore: 2,
        awayScore: 0,
        groupName: null,
        isDraw: false,
        winnerTeamId: 't2',
      },
    ];

    const standings = calculateStandings(['t1', 't2', 't3'], matches, defaultConfig);

    // t1: 3 pts, GD +2, GF 3
    // t2: 3 pts, GD +2, GF 2
    // t1 should be ranked higher due to more goals scored
    expect(standings[0].teamId).toBe('t1');
    expect(standings[1].teamId).toBe('t2');
  });

  it('handles sets for volleyball-style sports', () => {
    const matches: MatchResult[] = [
      {
        homeTeamId: 't1',
        awayTeamId: 't2',
        homeScore: 3,
        awayScore: 1,
        groupName: null,
        isDraw: false,
        winnerTeamId: 't1',
        sets: [
          { homeScore: 25, awayScore: 20 },
          { homeScore: 22, awayScore: 25 },
          { homeScore: 25, awayScore: 18 },
          { homeScore: 25, awayScore: 23 },
        ],
      },
    ];

    const standings = calculateStandings(['t1', 't2'], matches, defaultConfig);

    const t1 = standings.find((s) => s.teamId === 't1')!;
    expect(t1.setsWon).toBe(3);
    expect(t1.setsLost).toBe(1);

    const t2 = standings.find((s) => s.teamId === 't2')!;
    expect(t2.setsWon).toBe(1);
    expect(t2.setsLost).toBe(3);
  });

  it('respects custom point configuration', () => {
    const customConfig: StandingsConfig = {
      pointsForWin: 2,
      pointsForDraw: 1,
      pointsForLoss: 0,
    };

    const matches: MatchResult[] = [
      {
        homeTeamId: 't1',
        awayTeamId: 't2',
        homeScore: 1,
        awayScore: 0,
        groupName: null,
        isDraw: false,
        winnerTeamId: 't1',
      },
    ];

    const standings = calculateStandings(['t1', 't2'], matches, customConfig);

    const t1 = standings.find((s) => s.teamId === 't1')!;
    expect(t1.points).toBe(2);

    const t2 = standings.find((s) => s.teamId === 't2')!;
    expect(t2.points).toBe(0);
  });

  it('sets group name on all entries', () => {
    const standings = calculateStandings(['t1', 't2'], [], defaultConfig, 'A');

    for (const entry of standings) {
      expect(entry.groupName).toBe('A');
    }
  });

  it('tracks played count correctly', () => {
    const matches: MatchResult[] = [
      {
        homeTeamId: 't1',
        awayTeamId: 't2',
        homeScore: 1,
        awayScore: 0,
        groupName: null,
        isDraw: false,
        winnerTeamId: 't1',
      },
      {
        homeTeamId: 't1',
        awayTeamId: 't3',
        homeScore: 2,
        awayScore: 2,
        groupName: null,
        isDraw: true,
        winnerTeamId: null,
      },
    ];

    const standings = calculateStandings(['t1', 't2', 't3'], matches, defaultConfig);

    const t1 = standings.find((s) => s.teamId === 't1')!;
    expect(t1.played).toBe(2);

    const t2 = standings.find((s) => s.teamId === 't2')!;
    expect(t2.played).toBe(1);

    const t3 = standings.find((s) => s.teamId === 't3')!;
    expect(t3.played).toBe(1);
  });
});
