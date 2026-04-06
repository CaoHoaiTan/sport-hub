'use client';

import { useMemo } from 'react';

import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/lib/constants';
import { MatchStatusBadge } from '@/components/match/match-status-badge';

interface MatchTeam {
  id: string;
  name: string;
  logoUrl?: string | null;
}

interface BracketMatch {
  id: string;
  tournamentId: string;
  round?: number | null;
  roundName?: string | null;
  groupName?: string | null;
  bracketPosition?: number | null;
  status: string;
  homeScore?: number | null;
  awayScore?: number | null;
  homeTeam?: MatchTeam | null;
  awayTeam?: MatchTeam | null;
  winnerTeamId?: string | null;
}

interface BracketViewProps {
  matches: BracketMatch[];
  tournamentId: string;
  variant?: 'single' | 'double';
}

export function BracketView({ matches, tournamentId, variant = 'single' }: BracketViewProps) {
  if (variant === 'double') {
    return <DoubleBracket matches={matches} tournamentId={tournamentId} />;
  }

  return <SingleBracket matches={matches} tournamentId={tournamentId} />;
}

function SingleBracket({
  matches,
  tournamentId,
}: {
  matches: BracketMatch[];
  tournamentId: string;
}) {
  const rounds = useMemo(() => groupByRound(matches), [matches]);

  if (rounds.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No bracket matches available.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div
        className="flex gap-6 min-w-max"
        style={{ alignItems: 'center' }}
      >
        {rounds.map((round, roundIdx) => (
          <div key={round.label} className="flex flex-col gap-4 min-w-[240px]">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center">
              {round.label}
            </h4>
            <div
              className="flex flex-col justify-around flex-1"
              style={{
                gap: `${Math.pow(2, roundIdx) * 16}px`,
              }}
            >
              {round.matches.map((match) => (
                <BracketMatchCard
                  key={match.id}
                  match={match}
                  tournamentId={tournamentId}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DoubleBracket({
  matches,
  tournamentId,
}: {
  matches: BracketMatch[];
  tournamentId: string;
}) {
  const { winners, losers } = useMemo(() => {
    const w: BracketMatch[] = [];
    const l: BracketMatch[] = [];

    for (const m of matches) {
      const name = (m.roundName ?? '').toLowerCase();
      if (name.includes('loser') || name.includes('consolation')) {
        l.push(m);
      } else {
        w.push(m);
      }
    }

    return { winners: w, losers: l };
  }, [matches]);

  const winnersRounds = useMemo(() => groupByRound(winners), [winners]);
  const losersRounds = useMemo(() => groupByRound(losers), [losers]);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold mb-4 text-foreground">
          Winners Bracket
        </h3>
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max" style={{ alignItems: 'center' }}>
            {winnersRounds.map((round, roundIdx) => (
              <div key={round.label} className="flex flex-col gap-4 min-w-[240px]">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center">
                  {round.label}
                </h4>
                <div
                  className="flex flex-col justify-around flex-1"
                  style={{ gap: `${Math.pow(2, roundIdx) * 16}px` }}
                >
                  {round.matches.map((match) => (
                    <BracketMatchCard
                      key={match.id}
                      match={match}
                      tournamentId={tournamentId}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {losersRounds.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-4 text-foreground">
            Losers Bracket
          </h3>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-6 min-w-max" style={{ alignItems: 'center' }}>
              {losersRounds.map((round, roundIdx) => (
                <div key={round.label} className="flex flex-col gap-4 min-w-[240px]">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center">
                    {round.label}
                  </h4>
                  <div
                    className="flex flex-col justify-around flex-1"
                    style={{ gap: `${Math.pow(2, roundIdx) * 16}px` }}
                  >
                    {round.matches.map((match) => (
                      <BracketMatchCard
                        key={match.id}
                        match={match}
                        tournamentId={tournamentId}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BracketMatchCard({
  match,
  tournamentId,
}: {
  match: BracketMatch;
  tournamentId: string;
}) {
  const isCompleted = match.status === 'completed';
  const hasScore = match.homeScore != null && match.awayScore != null;

  return (
    <a
      href={ROUTES.matchDetail(tournamentId, match.id)}
      className={cn(
        'block rounded-lg border bg-card p-3 text-card-foreground shadow-sm transition-shadow hover:shadow-md',
        match.status === 'live' && 'ring-2 ring-red-500/20',
        isCompleted && 'opacity-90'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <MatchStatusBadge status={match.status} className="text-[10px] px-1.5 py-0" />
      </div>

      <div className="space-y-1.5">
        <BracketTeamRow
          team={match.homeTeam}
          score={match.homeScore}
          isWinner={isCompleted && match.winnerTeamId === match.homeTeam?.id}
          hasScore={hasScore}
        />
        <BracketTeamRow
          team={match.awayTeam}
          score={match.awayScore}
          isWinner={isCompleted && match.winnerTeamId === match.awayTeam?.id}
          hasScore={hasScore}
        />
      </div>
    </a>
  );
}

function BracketTeamRow({
  team,
  score,
  isWinner,
  hasScore,
}: {
  team?: MatchTeam | null;
  score?: number | null;
  isWinner: boolean;
  hasScore: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 rounded px-2 py-1 text-xs',
        isWinner && 'bg-green-500/10 font-semibold'
      )}
    >
      <span className={cn('truncate', !team && 'italic text-muted-foreground')}>
        {team?.name ?? 'TBD'}
      </span>
      {hasScore && (
        <span className="tabular-nums font-mono text-xs">
          {score ?? 0}
        </span>
      )}
    </div>
  );
}

interface RoundGroup {
  label: string;
  round: number;
  matches: BracketMatch[];
}

function groupByRound(matches: BracketMatch[]): RoundGroup[] {
  const map = new Map<number, { label: string; matches: BracketMatch[] }>();

  for (const m of matches) {
    const round = m.round ?? 0;
    const existing = map.get(round);
    if (existing) {
      existing.matches.push(m);
    } else {
      map.set(round, {
        label: m.roundName ?? `Round ${round}`,
        matches: [m],
      });
    }
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([round, data]) => ({
      label: data.label,
      round,
      matches: data.matches.sort(
        (a, b) => (a.bracketPosition ?? 0) - (b.bracketPosition ?? 0)
      ),
    }));
}
