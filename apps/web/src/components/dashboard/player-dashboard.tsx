'use client';

import { useQuery } from '@apollo/client';
import { Trophy, Swords, Target, HandHelping, Calendar } from 'lucide-react';
import Link from 'next/link';

import { ROUTES } from '@/lib/constants';
import { formatDateTime } from '@/lib/utils/format';
import { GET_PLAYER_DASHBOARD } from '@/graphql/queries/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from './stat-card';

interface MatchData {
  id: string;
  tournamentId: string;
  homeTeam?: { id: string; name: string };
  awayTeam?: { id: string; name: string };
  scheduledAt?: string;
  status: string;
  roundName?: string;
}

export function PlayerDashboard() {
  const { data, loading } = useQuery(GET_PLAYER_DASHBOARD);

  if (loading) {
    return <PlayerDashboardSkeleton />;
  }

  const dashboard = data?.playerDashboard;

  if (!dashboard) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Không thể tải dữ liệu tổng quan.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Giải đang diễn ra"
          value={dashboard.activeTournaments}
          icon={Trophy}
        />
        <StatCard
          title="Trận đã đấu"
          value={dashboard.totalMatchesPlayed}
          icon={Swords}
        />
        <StatCard
          title="Goals"
          value={dashboard.totalGoals}
          icon={Target}
        />
        <StatCard
          title="Assists"
          value={dashboard.totalAssists}
          icon={HandHelping}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Trận đấu sắp tới
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dashboard.upcomingMatches?.length > 0 ? (
            <div className="space-y-3">
              {dashboard.upcomingMatches.map((match: MatchData) => (
                <Link
                  key={match.id}
                  href={ROUTES.matchDetail(match.tournamentId, match.id)}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="truncate">
                        {match.homeTeam?.name ?? 'TBD'}
                      </span>
                      <span className="shrink-0 text-muted-foreground">vs</span>
                      <span className="truncate">
                        {match.awayTeam?.name ?? 'TBD'}
                      </span>
                    </div>
                    {match.roundName && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {match.roundName}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    {match.scheduledAt && (
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(match.scheduledAt)}
                      </p>
                    )}
                    <Badge variant="secondary" className="mt-1 text-[10px]">
                      {match.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Không có trận đấu sắp tới
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PlayerDashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
