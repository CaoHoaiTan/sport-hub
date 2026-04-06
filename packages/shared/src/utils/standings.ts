export interface StandingEntry {
  teamId: string;
  groupName: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  setsWon: number;
  setsLost: number;
  rank: number;
}

export interface MatchResult {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  groupName: string | null;
  isDraw: boolean;
  winnerTeamId: string | null;
  sets?: { homeScore: number; awayScore: number }[];
}

export interface StandingsConfig {
  pointsForWin: number;
  pointsForDraw: number;
  pointsForLoss: number;
}

/**
 * Calculate standings from completed match results.
 * Tiebreaker order: points > goal_difference > goals_for > head-to-head.
 */
export function calculateStandings(
  teamIds: string[],
  matches: MatchResult[],
  config: StandingsConfig,
  groupName: string | null = null
): StandingEntry[] {
  const map = new Map<string, StandingEntry>();

  for (const teamId of teamIds) {
    map.set(teamId, {
      teamId,
      groupName,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      setsWon: 0,
      setsLost: 0,
      rank: 0,
    });
  }

  // Head-to-head record for tiebreakers
  const h2h = new Map<string, number>(); // "teamA:teamB" => point advantage for teamA

  for (const match of matches) {
    const home = map.get(match.homeTeamId);
    const away = map.get(match.awayTeamId);
    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    if (match.sets) {
      let homeSetsWon = 0;
      let awaySetsWon = 0;
      for (const set of match.sets) {
        if (set.homeScore > set.awayScore) homeSetsWon++;
        else if (set.awayScore > set.homeScore) awaySetsWon++;
      }
      home.setsWon += homeSetsWon;
      home.setsLost += awaySetsWon;
      away.setsWon += awaySetsWon;
      away.setsLost += homeSetsWon;
    }

    const h2hKey = `${match.homeTeamId}:${match.awayTeamId}`;
    const h2hKeyReverse = `${match.awayTeamId}:${match.homeTeamId}`;

    if (match.isDraw) {
      home.drawn++;
      away.drawn++;
      home.points += config.pointsForDraw;
      away.points += config.pointsForDraw;
      h2h.set(h2hKey, (h2h.get(h2hKey) ?? 0));
      h2h.set(h2hKeyReverse, (h2h.get(h2hKeyReverse) ?? 0));
    } else if (match.winnerTeamId === match.homeTeamId) {
      home.won++;
      away.lost++;
      home.points += config.pointsForWin;
      away.points += config.pointsForLoss;
      h2h.set(h2hKey, (h2h.get(h2hKey) ?? 0) + 1);
      h2h.set(h2hKeyReverse, (h2h.get(h2hKeyReverse) ?? 0) - 1);
    } else {
      away.won++;
      home.lost++;
      away.points += config.pointsForWin;
      home.points += config.pointsForLoss;
      h2h.set(h2hKey, (h2h.get(h2hKey) ?? 0) - 1);
      h2h.set(h2hKeyReverse, (h2h.get(h2hKeyReverse) ?? 0) + 1);
    }
  }

  // Compute goal difference
  for (const entry of map.values()) {
    entry.goalDifference = entry.goalsFor - entry.goalsAgainst;
  }

  // Sort with tiebreakers
  const entries = [...map.values()];
  entries.sort((a, b) => {
    // 1. Points (descending)
    if (b.points !== a.points) return b.points - a.points;
    // 2. Goal difference (descending)
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    // 3. Goals for (descending)
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    // 4. Head-to-head
    const h2hVal = h2h.get(`${a.teamId}:${b.teamId}`) ?? 0;
    return -h2hVal; // positive means a beat b, so a ranks higher (lower index)
  });

  // Assign ranks
  for (let i = 0; i < entries.length; i++) {
    entries[i].rank = i + 1;
  }

  return entries;
}
