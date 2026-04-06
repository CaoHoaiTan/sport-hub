import { describe, it, expect } from 'vitest';
import { generateSingleElimination } from '../bracket.js';
import type { BracketTeam } from '../bracket.js';

function makeTeams(count: number): BracketTeam[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `team-${i + 1}`,
    seed: i + 1,
  }));
}

describe('generateSingleElimination', () => {
  it('returns empty for fewer than 2 teams', () => {
    expect(generateSingleElimination([])).toEqual([]);
    expect(generateSingleElimination([{ id: 'a', seed: 1 }])).toEqual([]);
  });

  it('generates correct number of matches for 8 teams (7 total)', () => {
    const teams = makeTeams(8);
    const matches = generateSingleElimination(teams);

    // 8 teams => bracketSize=8, totalRounds=3
    // 4 (R1) + 2 (R2) + 1 (R3) = 7
    expect(matches).toHaveLength(7);

    const round1 = matches.filter((m) => m.round === 1);
    expect(round1).toHaveLength(4);

    const round2 = matches.filter((m) => m.round === 2);
    expect(round2).toHaveLength(2);

    const round3 = matches.filter((m) => m.round === 3);
    expect(round3).toHaveLength(1);
  });

  it('generates correct number of matches for 4 teams (3 total)', () => {
    const teams = makeTeams(4);
    const matches = generateSingleElimination(teams);

    // 4 teams => bracketSize=4, totalRounds=2
    // 2 (R1) + 1 (R2) = 3
    expect(matches).toHaveLength(3);

    const round1 = matches.filter((m) => m.round === 1);
    expect(round1).toHaveLength(2);

    const round2 = matches.filter((m) => m.round === 2);
    expect(round2).toHaveLength(1);
  });

  it('creates bye slots for non-power-of-2 teams (5 teams)', () => {
    const teams = makeTeams(5);
    const matches = generateSingleElimination(teams);

    // Bracket size = 8 (next power of 2), totalRounds = 3
    // First round: pairs where both slots are null get skipped
    // Slots: [t1,t2], [t3,t4], [t5,null], [null,null] -> 3 matches in R1
    const round1 = matches.filter((m) => m.round === 1);
    expect(round1).toHaveLength(3);

    // Bye matches (one side is null)
    const byeMatches = round1.filter(
      (m) => m.homeTeamId === null || m.awayTeamId === null
    );
    expect(byeMatches).toHaveLength(1);

    // All 5 teams should appear in round 1
    const teamIdsInR1 = round1
      .flatMap((m) => [m.homeTeamId, m.awayTeamId])
      .filter(Boolean);
    expect(teamIdsInR1).toHaveLength(5);
  });

  it('handles byes for 3 teams', () => {
    const teams = makeTeams(3);
    const matches = generateSingleElimination(teams);

    // Bracket size = 4, totalRounds = 2
    // 2 (R1) + 1 (R2) = 3
    expect(matches).toHaveLength(3);

    const round1 = matches.filter((m) => m.round === 1);
    const byeMatches = round1.filter(
      (m) => m.homeTeamId === null || m.awayTeamId === null
    );
    // 4 - 3 = 1 bye
    expect(byeMatches).toHaveLength(1);
  });

  it('assigns unique bracket positions', () => {
    const teams = makeTeams(8);
    const matches = generateSingleElimination(teams);

    const positions = matches.map((m) => m.bracketPosition);
    const uniquePositions = new Set(positions);
    expect(uniquePositions.size).toBe(matches.length);
  });

  it('populates first-round with team IDs for power-of-2 teams', () => {
    const teams = makeTeams(4);
    const matches = generateSingleElimination(teams);

    const round1 = matches.filter((m) => m.round === 1);
    const allTeamIds = round1.flatMap((m) => [m.homeTeamId, m.awayTeamId]).filter(Boolean);
    expect(allTeamIds).toHaveLength(4);
  });

  it('subsequent rounds have null team IDs (placeholders)', () => {
    const teams = makeTeams(8);
    const matches = generateSingleElimination(teams);

    const laterRounds = matches.filter((m) => m.round > 1);
    for (const match of laterRounds) {
      expect(match.homeTeamId).toBeNull();
      expect(match.awayTeamId).toBeNull();
    }
  });

  it('handles 2 teams (single match)', () => {
    const teams = makeTeams(2);
    const matches = generateSingleElimination(teams);

    expect(matches).toHaveLength(1);
    expect(matches[0].round).toBe(1);
    expect(matches[0].homeTeamId).toBe('team-1');
    expect(matches[0].awayTeamId).toBe('team-2');
  });

  it('sorts teams by seed before placing in bracket', () => {
    const teams: BracketTeam[] = [
      { id: 'unseeded-a' },
      { id: 'seed-3', seed: 3 },
      { id: 'seed-1', seed: 1 },
      { id: 'seed-2', seed: 2 },
    ];

    const matches = generateSingleElimination(teams);
    const round1 = matches.filter((m) => m.round === 1);

    // Seed 1 should be in the first match as home
    expect(round1[0].homeTeamId).toBe('seed-1');
  });

  it('assigns round names to all matches', () => {
    const teams = makeTeams(8);
    const matches = generateSingleElimination(teams);

    for (const match of matches) {
      expect(match.roundName).toBeTruthy();
      expect(typeof match.roundName).toBe('string');
    }
  });
});
