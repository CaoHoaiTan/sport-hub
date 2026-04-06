'use client';

import { useMemo } from 'react';

import { ROUTES } from '@/lib/constants';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MatchCard } from '@/components/match/match-card';

interface MatchTeam {
  id: string;
  name: string;
  logoUrl?: string | null;
}

interface MatchData {
  id: string;
  tournamentId: string;
  round?: number | null;
  roundName?: string | null;
  groupName?: string | null;
  bracketPosition?: number | null;
  scheduledAt?: string | null;
  status: string;
  homeScore?: number | null;
  awayScore?: number | null;
  homeTeam?: MatchTeam | null;
  awayTeam?: MatchTeam | null;
  venue?: { id: string; name: string } | null;
  sets?: { id: string; setNumber: number; homeScore: number; awayScore: number }[] | null;
}

interface MatchScheduleProps {
  matches: MatchData[];
  tournamentId: string;
  readOnly?: boolean;
}

export function MatchSchedule({ matches, tournamentId, readOnly }: MatchScheduleProps) {
  const groups = useMemo(() => {
    const groupSet = new Set<string>();
    for (const m of matches) {
      if (m.groupName) {
        groupSet.add(m.groupName);
      }
    }
    return Array.from(groupSet).sort();
  }, [matches]);

  const hasGroups = groups.length > 0;

  if (hasGroups) {
    return (
      <Tabs defaultValue={groups[0]} className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          {groups.map((group) => (
            <TabsTrigger key={group} value={group}>
              {group}
            </TabsTrigger>
          ))}
        </TabsList>
        {groups.map((group) => (
          <TabsContent key={group} value={group}>
            <RoundGroupedMatches
              matches={matches.filter((m) => m.groupName === group)}
              tournamentId={tournamentId}
              readOnly={readOnly}
            />
          </TabsContent>
        ))}
      </Tabs>
    );
  }

  return (
    <RoundGroupedMatches
      matches={matches}
      tournamentId={tournamentId}
      readOnly={readOnly}
    />
  );
}

function RoundGroupedMatches({
  matches,
  tournamentId,
  readOnly,
}: {
  matches: MatchData[];
  tournamentId: string;
  readOnly?: boolean;
}) {
  const roundGroups = useMemo(() => {
    const map = new Map<string, MatchData[]>();
    for (const m of matches) {
      const key = m.roundName ?? `Round ${m.round ?? '?'}`;
      const existing = map.get(key);
      if (existing) {
        existing.push(m);
      } else {
        map.set(key, [m]);
      }
    }
    return Array.from(map.entries());
  }, [matches]);

  if (roundGroups.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No matches scheduled yet.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {roundGroups.map(([roundLabel, roundMatches]) => (
        <div key={roundLabel} className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {roundLabel}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {roundMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                href={
                  readOnly
                    ? undefined
                    : ROUTES.matchDetail(tournamentId, match.id)
                }
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
