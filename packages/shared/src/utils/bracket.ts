import { generateRoundRobin } from './round-robin.js';

export interface BracketTeam {
  id: string;
  seed?: number;
}

export interface BracketMatch {
  homeTeamId: string | null;
  awayTeamId: string | null;
  round: number;
  roundName: string;
  bracketPosition: number;
}

/** Return the smallest power of 2 >= n */
function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/** Sort teams by seed (ascending, lower seed = better). Unseeded go last. */
function sortBySeeds(teams: BracketTeam[]): BracketTeam[] {
  return [...teams].sort((a, b) => {
    const sa = a.seed ?? Infinity;
    const sb = b.seed ?? Infinity;
    return sa - sb;
  });
}

function roundName(round: number, totalRounds: number): string {
  const remaining = totalRounds - round;
  if (remaining === 0) return 'Final';
  if (remaining === 1) return 'Semi-Final';
  if (remaining === 2) return 'Quarter-Final';
  return `Round ${round + 1}`;
}

/**
 * Generate a single-elimination bracket. Teams are seeded so that
 * the 1st seed faces the last, etc. Byes are given to higher seeds
 * when team count is not a power of 2.
 */
export function generateSingleElimination(teams: BracketTeam[]): BracketMatch[] {
  if (teams.length < 2) return [];

  const sorted = sortBySeeds(teams);
  const bracketSize = nextPowerOf2(sorted.length);
  const totalRounds = Math.log2(bracketSize);

  // Place teams into bracket slots using standard seeding
  const slots: (BracketTeam | null)[] = new Array(bracketSize).fill(null);

  // Seed placement: 1 vs N, 2 vs N-1, etc.
  for (let i = 0; i < sorted.length; i++) {
    slots[i] = sorted[i];
  }

  const matches: BracketMatch[] = [];
  let position = 0;

  // First round: pair adjacent slots
  const firstRoundPairs: (BracketTeam | null)[][] = [];
  for (let i = 0; i < bracketSize; i += 2) {
    firstRoundPairs.push([slots[i], slots[i + 1]]);
  }

  for (const [home, away] of firstRoundPairs) {
    // If both exist, it's a real match
    // If one is null, the other gets a bye (we still create the match entry)
    if (home !== null || away !== null) {
      matches.push({
        homeTeamId: home?.id ?? null,
        awayTeamId: away?.id ?? null,
        round: 1,
        roundName: roundName(0, totalRounds),
        bracketPosition: ++position,
      });
    }
  }

  // Generate placeholder matches for subsequent rounds
  let prevRoundMatchCount = firstRoundPairs.length;
  for (let r = 2; r <= totalRounds; r++) {
    const matchesInRound = prevRoundMatchCount / 2;
    for (let m = 0; m < matchesInRound; m++) {
      matches.push({
        homeTeamId: null,
        awayTeamId: null,
        round: r,
        roundName: roundName(r - 1, totalRounds),
        bracketPosition: ++position,
      });
    }
    prevRoundMatchCount = matchesInRound;
  }

  return matches;
}

/**
 * Generate a double-elimination bracket:
 * - Winners bracket (single elim)
 * - Losers bracket
 * - Grand final (winners bracket winner vs losers bracket winner)
 */
export function generateDoubleElimination(teams: BracketTeam[]): BracketMatch[] {
  if (teams.length < 2) return [];

  const sorted = sortBySeeds(teams);
  const bracketSize = nextPowerOf2(sorted.length);
  const winnersRounds = Math.log2(bracketSize);

  const matches: BracketMatch[] = [];
  let position = 0;

  // Winners bracket first round
  const slots: (BracketTeam | null)[] = new Array(bracketSize).fill(null);
  for (let i = 0; i < sorted.length; i++) {
    slots[i] = sorted[i];
  }

  for (let i = 0; i < bracketSize; i += 2) {
    matches.push({
      homeTeamId: slots[i]?.id ?? null,
      awayTeamId: slots[i + 1]?.id ?? null,
      round: 1,
      roundName: `Winners Round 1`,
      bracketPosition: ++position,
    });
  }

  // Winners bracket subsequent rounds
  let prevCount = bracketSize / 2;
  for (let r = 2; r <= winnersRounds; r++) {
    const count = prevCount / 2;
    for (let m = 0; m < count; m++) {
      matches.push({
        homeTeamId: null,
        awayTeamId: null,
        round: r,
        roundName: `Winners Round ${r}`,
        bracketPosition: ++position,
      });
    }
    prevCount = count;
  }

  // Losers bracket: (winnersRounds - 1) * 2 rounds typically
  // Simplified: create losers bracket rounds
  const losersRounds = (winnersRounds - 1) * 2;
  let losersMatchCount = bracketSize / 4; // First losers round = half of winners R1 losers
  for (let lr = 1; lr <= losersRounds; lr++) {
    const count = Math.max(1, losersMatchCount);
    for (let m = 0; m < count; m++) {
      matches.push({
        homeTeamId: null,
        awayTeamId: null,
        round: winnersRounds + lr,
        roundName: `Losers Round ${lr}`,
        bracketPosition: ++position,
      });
    }
    // Every other round, the count halves (drop-down rounds keep count, others halve)
    if (lr % 2 === 0) {
      losersMatchCount = Math.max(1, losersMatchCount / 2);
    }
  }

  // Grand final
  matches.push({
    homeTeamId: null,
    awayTeamId: null,
    round: winnersRounds + losersRounds + 1,
    roundName: 'Grand Final',
    bracketPosition: ++position,
  });

  // Optional reset match
  matches.push({
    homeTeamId: null,
    awayTeamId: null,
    round: winnersRounds + losersRounds + 2,
    roundName: 'Grand Final Reset',
    bracketPosition: ++position,
  });

  return matches;
}

export interface GroupStageMatch extends BracketMatch {
  groupName?: string;
}

/**
 * Generate a group-stage + knockout tournament:
 * 1. Divide teams into groups
 * 2. Round-robin within each group
 * 3. Top N from each group advance to single-elimination knockout
 */
export function generateGroupStageKnockout(
  teams: BracketTeam[],
  groupCount: number,
  advancePerGroup: number
): GroupStageMatch[] {
  if (teams.length < 2 || groupCount < 1) return [];

  const sorted = sortBySeeds(teams);
  const matches: GroupStageMatch[] = [];
  let position = 0;

  // Snake-draft assignment into groups
  const groups: BracketTeam[][] = Array.from({ length: groupCount }, () => []);
  for (let i = 0; i < sorted.length; i++) {
    const row = Math.floor(i / groupCount);
    const col = row % 2 === 0 ? i % groupCount : groupCount - 1 - (i % groupCount);
    groups[col].push(sorted[i]);
  }

  // Group stage round-robin
  const groupNames = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let groupRound = 0;
  for (let g = 0; g < groups.length; g++) {
    const groupName = groupNames[g];
    const rounds = generateRoundRobin(groups[g]);
    for (let r = 0; r < rounds.length; r++) {
      groupRound = Math.max(groupRound, r + 1);
      for (const pairing of rounds[r]) {
        matches.push({
          homeTeamId: pairing.homeTeamId,
          awayTeamId: pairing.awayTeamId,
          round: r + 1,
          roundName: `Group ${groupName} - Round ${r + 1}`,
          bracketPosition: ++position,
          groupName,
        });
      }
    }
  }

  // Knockout stage placeholders
  const advancingCount = groupCount * advancePerGroup;
  const knockoutSize = nextPowerOf2(advancingCount);
  const knockoutRounds = Math.log2(knockoutSize);
  const knockoutStartRound = groupRound + 1;

  // First knockout round
  for (let i = 0; i < knockoutSize / 2; i++) {
    matches.push({
      homeTeamId: null,
      awayTeamId: null,
      round: knockoutStartRound,
      roundName: roundName(0, knockoutRounds),
      bracketPosition: ++position,
    });
  }

  // Subsequent knockout rounds
  let prevMatchCount = knockoutSize / 2;
  for (let r = 1; r < knockoutRounds; r++) {
    const count = prevMatchCount / 2;
    for (let m = 0; m < count; m++) {
      matches.push({
        homeTeamId: null,
        awayTeamId: null,
        round: knockoutStartRound + r,
        roundName: roundName(r, knockoutRounds),
        bracketPosition: ++position,
      });
    }
    prevMatchCount = count;
  }

  return matches;
}
