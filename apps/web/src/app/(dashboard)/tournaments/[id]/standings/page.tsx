'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { BarChart3 } from 'lucide-react';

import { GET_STANDINGS, GET_PLAYER_STATISTICS } from '@/graphql/queries/standing';
import { GET_TOURNAMENT } from '@/graphql/queries/tournament';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StandingsTable } from '@/components/standing/standings-table';
import { PlayerStatsTable } from '@/components/standing/player-stats-table';

export default function TournamentStandingsPage() {
  const params = useParams();
  const tournamentId = params.id as string;

  const { data: tournamentData } = useQuery(GET_TOURNAMENT, {
    variables: { id: tournamentId },
    skip: !tournamentId,
  });

  const { data, loading } = useQuery(GET_STANDINGS, {
    variables: { tournamentId },
    skip: !tournamentId,
  });

  const { data: statsData, loading: statsLoading } = useQuery(
    GET_PLAYER_STATISTICS,
    {
      variables: { tournamentId },
      skip: !tournamentId,
    }
  );

  const tournament = tournamentData?.tournament;
  const standings = data?.standingsByTournament ?? [];
  const playerStats = statsData?.playerStatistics ?? [];
  const sport = tournament?.sport ?? 'football';
  const teamsPerGroupAdvance = tournament?.teamsPerGroupAdvance ?? 2;

  const groups = useMemo(() => {
    const groupSet = new Set<string>();
    for (const s of standings) {
      if (s.groupName) {
        groupSet.add(s.groupName);
      }
    }
    return Array.from(groupSet).sort();
  }, [standings]);

  const hasGroups = groups.length > 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Standings</h2>
      </div>

      {standings.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground">
            Chưa có dữ liệu bảng xếp hạng.
          </p>
          <p className="text-sm text-muted-foreground">
            Standings will be generated once matches are played.
          </p>
        </div>
      ) : hasGroups ? (
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
              <StandingsTable
                standings={standings.filter(
                  (s: { groupName?: string | null }) => s.groupName === group
                )}
                sport={sport}
                highlightTopN={teamsPerGroupAdvance}
              />
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <StandingsTable standings={standings} sport={sport} />
      )}

      <div className="space-y-4">
        <h3 className="text-base font-semibold">Player Statistics</h3>
        {statsLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <PlayerStatsTable statistics={playerStats} sport={sport} />
        )}
      </div>
    </div>
  );
}
