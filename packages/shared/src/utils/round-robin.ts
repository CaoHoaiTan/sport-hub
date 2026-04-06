export interface RoundRobinTeam {
  id: string;
}

export interface MatchPairing {
  homeTeamId: string;
  awayTeamId: string;
}

/**
 * Generate a round-robin schedule using the circle (polygon) method.
 * If the number of teams is odd, a "bye" placeholder is added. Matches
 * involving the bye entry are excluded from the output.
 */
export function generateRoundRobin(teams: RoundRobinTeam[]): MatchPairing[][] {
  if (teams.length < 2) {
    return [];
  }

  const entries = [...teams];
  const hasBye = entries.length % 2 !== 0;

  // Add a virtual bye team for odd counts
  if (hasBye) {
    entries.push({ id: '__bye__' });
  }

  const n = entries.length;
  const totalRounds = n - 1;

  // Fix the first team; rotate the rest
  const fixed = entries[0];
  const rotating = entries.slice(1);

  const rounds: MatchPairing[][] = [];

  for (let round = 0; round < totalRounds; round++) {
    const roundMatches: MatchPairing[] = [];

    // First match: fixed vs first rotating element
    const opponent = rotating[0];
    if (fixed.id !== '__bye__' && opponent.id !== '__bye__') {
      roundMatches.push({
        homeTeamId: round % 2 === 0 ? fixed.id : opponent.id,
        awayTeamId: round % 2 === 0 ? opponent.id : fixed.id,
      });
    }

    // Remaining pairings by folding the rotating array
    for (let i = 1; i < n / 2; i++) {
      const home = rotating[i];
      const away = rotating[n - 2 - i]; // n-2 because rotating length = n-1
      if (home.id !== '__bye__' && away.id !== '__bye__') {
        roundMatches.push({
          homeTeamId: home.id,
          awayTeamId: away.id,
        });
      }
    }

    rounds.push(roundMatches);

    // Rotate: move last element to front
    rotating.unshift(rotating.pop()!);
  }

  return rounds;
}
