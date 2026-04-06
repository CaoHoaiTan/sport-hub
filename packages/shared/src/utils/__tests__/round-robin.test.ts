import { describe, it, expect } from 'vitest';
import { generateRoundRobin } from '../round-robin.js';
import type { RoundRobinTeam } from '../round-robin.js';

function makeTeams(count: number): RoundRobinTeam[] {
  return Array.from({ length: count }, (_, i) => ({ id: `team-${i + 1}` }));
}

/** Flatten all rounds into a single list of pairings. */
function flattenMatches(rounds: ReturnType<typeof generateRoundRobin>) {
  return rounds.flatMap((round) => round);
}

describe('generateRoundRobin', () => {
  it('returns empty for fewer than 2 teams', () => {
    expect(generateRoundRobin([])).toEqual([]);
    expect(generateRoundRobin([{ id: 'a' }])).toEqual([]);
  });

  it('generates correct number of matches for 4 teams (6 matches)', () => {
    const teams = makeTeams(4);
    const rounds = generateRoundRobin(teams);
    const allMatches = flattenMatches(rounds);

    // 4 teams => C(4,2) = 6 matches
    expect(allMatches).toHaveLength(6);

    // 4 teams => 3 rounds
    expect(rounds).toHaveLength(3);

    // Each round should have 2 matches
    for (const round of rounds) {
      expect(round).toHaveLength(2);
    }
  });

  it('handles 5 teams with bye correctly', () => {
    const teams = makeTeams(5);
    const rounds = generateRoundRobin(teams);

    // 5 teams (odd) => bye added => 6 entries => 5 rounds
    expect(rounds).toHaveLength(5);

    // Verify no bye team IDs leak into the output
    const allMatches = flattenMatches(rounds);
    for (const match of allMatches) {
      expect(match.homeTeamId).not.toBe('__bye__');
      expect(match.awayTeamId).not.toBe('__bye__');
    }

    // Each round has either 2 or 3 matches
    // (the bye removes one pairing from some rounds)
    for (const round of rounds) {
      expect(round.length).toBeGreaterThanOrEqual(2);
      expect(round.length).toBeLessThanOrEqual(3);
    }
  });

  it('ensures every team plays every other team exactly once (all-play-all)', () => {
    const teams = makeTeams(4);
    const rounds = generateRoundRobin(teams);
    const allMatches = flattenMatches(rounds);

    // Build a set of all unique pairings
    const pairings = new Set<string>();
    for (const match of allMatches) {
      const pair = [match.homeTeamId, match.awayTeamId].sort().join(':');
      pairings.add(pair);
    }

    // C(4,2) = 6 unique pairings
    expect(pairings.size).toBe(6);

    // Each team should appear in exactly 3 matches (plays 3 opponents)
    const teamMatchCounts = new Map<string, number>();
    for (const match of allMatches) {
      teamMatchCounts.set(match.homeTeamId, (teamMatchCounts.get(match.homeTeamId) ?? 0) + 1);
      teamMatchCounts.set(match.awayTeamId, (teamMatchCounts.get(match.awayTeamId) ?? 0) + 1);
    }
    for (const team of teams) {
      expect(teamMatchCounts.get(team.id)).toBe(3);
    }
  });

  it('ensures no duplicate pairings', () => {
    const teams = makeTeams(6);
    const rounds = generateRoundRobin(teams);
    const allMatches = flattenMatches(rounds);

    const pairings = new Set<string>();
    for (const match of allMatches) {
      const pair = [match.homeTeamId, match.awayTeamId].sort().join(':');
      expect(pairings.has(pair)).toBe(false);
      pairings.add(pair);
    }

    // C(6,2) = 15
    expect(pairings.size).toBe(15);
  });

  it('no team plays twice in the same round', () => {
    const teams = makeTeams(6);
    const rounds = generateRoundRobin(teams);

    for (const round of rounds) {
      const teamsInRound = new Set<string>();
      for (const match of round) {
        expect(teamsInRound.has(match.homeTeamId)).toBe(false);
        expect(teamsInRound.has(match.awayTeamId)).toBe(false);
        teamsInRound.add(match.homeTeamId);
        teamsInRound.add(match.awayTeamId);
      }
    }
  });

  it('handles 2 teams (1 match)', () => {
    const teams = makeTeams(2);
    const rounds = generateRoundRobin(teams);
    const allMatches = flattenMatches(rounds);

    expect(rounds).toHaveLength(1);
    expect(allMatches).toHaveLength(1);
    expect(allMatches[0].homeTeamId).toBe('team-1');
    expect(allMatches[0].awayTeamId).toBe('team-2');
  });
});
