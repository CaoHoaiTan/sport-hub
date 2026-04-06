import Link from 'next/link';
import { Clock, MapPin } from 'lucide-react';

import { cn } from '@/lib/utils/cn';
import { formatDateTime } from '@/lib/utils/format';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

interface MatchCardProps {
  match: {
    id: string;
    homeTeam?: MatchTeam | null;
    awayTeam?: MatchTeam | null;
    homeScore?: number | null;
    awayScore?: number | null;
    status: string;
    scheduledAt?: string | null;
    roundName?: string | null;
    venue?: { id: string; name: string } | null;
    sets?: MatchSet[] | null;
  };
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function MatchCard({ match, href, onClick, className }: MatchCardProps) {
  const isCompleted = match.status === 'completed';
  const isLive = match.status === 'live';
  const hasScore = match.homeScore != null && match.awayScore != null;

  const content = (
    <Card
      className={cn(
        'transition-shadow hover:shadow-md cursor-pointer',
        isLive && 'ring-2 ring-red-500/20',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          {match.roundName && (
            <Badge variant="outline" className="text-xs font-normal">
              {match.roundName}
            </Badge>
          )}
          <MatchStatusBadge status={match.status} />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 text-right">
            <TeamDisplay team={match.homeTeam} align="right" />
          </div>

          <div className="flex flex-col items-center shrink-0 min-w-[64px]">
            {hasScore ? (
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'text-xl font-bold tabular-nums',
                    isCompleted &&
                      match.homeScore! > match.awayScore! &&
                      'text-green-600'
                  )}
                >
                  {match.homeScore}
                </span>
                <span className="text-muted-foreground text-sm">-</span>
                <span
                  className={cn(
                    'text-xl font-bold tabular-nums',
                    isCompleted &&
                      match.awayScore! > match.homeScore! &&
                      'text-green-600'
                  )}
                >
                  {match.awayScore}
                </span>
              </div>
            ) : (
              <span className="text-lg font-semibold text-muted-foreground">
                vs
              </span>
            )}

            {match.sets && match.sets.length > 0 && (
              <div className="flex gap-1 mt-1">
                {match.sets.map((set) => (
                  <span
                    key={set.id}
                    className="text-[10px] text-muted-foreground tabular-nums"
                  >
                    ({set.homeScore}-{set.awayScore})
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1">
            <TeamDisplay team={match.awayTeam} align="left" />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {match.scheduledAt && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDateTime(match.scheduledAt)}
            </span>
          )}
          {match.venue && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {match.venue.name}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

function TeamDisplay({
  team,
  align,
}: {
  team?: MatchTeam | null;
  align: 'left' | 'right';
}) {
  if (!team) {
    return (
      <p
        className={cn(
          'text-sm text-muted-foreground italic',
          align === 'right' ? 'text-right' : 'text-left'
        )}
      >
        TBD
      </p>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        align === 'right' && 'flex-row-reverse'
      )}
    >
      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-bold uppercase text-muted-foreground">
        {team.name.charAt(0)}
      </div>
      <p
        className={cn(
          'text-sm font-medium truncate',
          align === 'right' ? 'text-right' : 'text-left'
        )}
      >
        {team.name}
      </p>
    </div>
  );
}
