import { cn } from '@/lib/utils/cn';
import { formatDateTime } from '@/lib/utils/format';
import { MatchStatusBadge } from '@/components/match/match-status-badge';

interface MatchTeam {
  id: string;
  name: string;
  logoUrl?: string | null;
}

interface MatchSet {
  id: string;
  setNumber: number;
  homeScore: number;
  awayScore: number;
}

interface LiveScoreBoardProps {
  match: {
    id: string;
    status: string;
    homeTeam?: MatchTeam | null;
    awayTeam?: MatchTeam | null;
    homeScore?: number | null;
    awayScore?: number | null;
    scheduledAt?: string | null;
    venue?: { id: string; name: string } | null;
    roundName?: string | null;
    sets?: MatchSet[] | null;
  };
  className?: string;
}

export function LiveScoreBoard({ match, className }: LiveScoreBoardProps) {
  const isLive = match.status === 'live';
  const hasScore = match.homeScore != null && match.awayScore != null;
  const hasSets = match.sets && match.sets.length > 0;

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-6 text-card-foreground',
        isLive && 'ring-2 ring-red-500/20',
        className
      )}
    >
      <div className="flex items-center justify-center mb-4">
        <MatchStatusBadge status={match.status} />
      </div>

      <div className="flex items-center justify-center gap-6 sm:gap-10">
        <TeamBlock team={match.homeTeam} />

        <div className="flex flex-col items-center">
          {hasScore ? (
            <div className="flex items-center gap-2">
              <span className="text-4xl sm:text-5xl font-bold tabular-nums">
                {match.homeScore}
              </span>
              <span className="text-2xl text-muted-foreground">:</span>
              <span className="text-4xl sm:text-5xl font-bold tabular-nums">
                {match.awayScore}
              </span>
            </div>
          ) : (
            <span className="text-2xl font-semibold text-muted-foreground">
              vs
            </span>
          )}

          {isLive && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              <span className="text-xs font-medium text-red-600">LIVE</span>
            </div>
          )}
        </div>

        <TeamBlock team={match.awayTeam} />
      </div>

      {hasSets && (
        <div className="mt-4 flex justify-center gap-3 flex-wrap">
          {[...match.sets!]
            .sort((a, b) => a.setNumber - b.setNumber)
            .map((set) => (
              <div
                key={set.id}
                className="rounded-md border bg-muted/50 px-3 py-1.5 text-center"
              >
                <p className="text-[10px] text-muted-foreground uppercase">
                  Set {set.setNumber}
                </p>
                <p className="text-sm font-semibold tabular-nums">
                  {set.homeScore} - {set.awayScore}
                </p>
              </div>
            ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        {match.roundName && <span>{match.roundName}</span>}
        {match.scheduledAt && <span>{formatDateTime(match.scheduledAt)}</span>}
        {match.venue && <span>{match.venue.name}</span>}
      </div>
    </div>
  );
}

function TeamBlock({ team }: { team?: MatchTeam | null }) {
  return (
    <div className="flex flex-col items-center gap-2 min-w-[80px]">
      <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-xl font-bold uppercase text-muted-foreground shrink-0">
        {team?.name?.charAt(0) ?? '?'}
      </div>
      <p className="text-sm font-medium text-center max-w-[120px] truncate">
        {team?.name ?? 'TBD'}
      </p>
    </div>
  );
}
