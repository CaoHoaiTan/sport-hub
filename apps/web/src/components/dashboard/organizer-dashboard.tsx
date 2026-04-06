'use client';

import { useQuery } from '@apollo/client';
import {
  Trophy,
  Users,
  UserCheck,
  DollarSign,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/lib/constants';
import { formatVND, formatDateTime } from '@/lib/utils/format';
import { GET_ORGANIZER_DASHBOARD } from '@/graphql/queries/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from './stat-card';

export function OrganizerDashboard() {
  const { data, loading } = useQuery(GET_ORGANIZER_DASHBOARD);

  if (loading) {
    return <OrganizerDashboardSkeleton />;
  }

  const dashboard = data?.organizerDashboard;

  if (!dashboard) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Unable to load dashboard data.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Tournaments"
          value={dashboard.activeTournaments}
          icon={Trophy}
        />
        <StatCard
          title="Total Teams"
          value={dashboard.totalTeams}
          icon={Users}
        />
        <StatCard
          title="Total Players"
          value={dashboard.totalPlayers}
          icon={UserCheck}
        />
        <StatCard
          title="Revenue"
          value={formatVND(dashboard.financialSummary?.totalRevenue ?? 0)}
          icon={DollarSign}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Upcoming Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.upcomingMatches?.length > 0 ? (
              <div className="space-y-3">
                {dashboard.upcomingMatches.slice(0, 5).map((match: MatchData) => (
                  <MatchListItem key={match.id} match={match} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No upcoming matches
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              Recent Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.recentResults?.length > 0 ? (
              <div className="space-y-3">
                {dashboard.recentResults.slice(0, 5).map((match: MatchData) => (
                  <MatchListItem key={match.id} match={match} showScore />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No recent results
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {dashboard.financialSummary && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FinancialItem
                label="Total Revenue"
                amount={dashboard.financialSummary.totalRevenue}
                variant="default"
              />
              <FinancialItem
                label="Paid"
                amount={dashboard.financialSummary.totalPaid}
                variant="success"
              />
              <FinancialItem
                label="Pending"
                amount={dashboard.financialSummary.totalPending}
                variant="warning"
              />
              <FinancialItem
                label="Refunded"
                amount={dashboard.financialSummary.totalRefunded}
                variant="destructive"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface MatchData {
  id: string;
  tournamentId: string;
  homeTeam?: { id: string; name: string; logoUrl?: string };
  awayTeam?: { id: string; name: string; logoUrl?: string };
  scheduledAt?: string;
  homeScore?: number;
  awayScore?: number;
  status: string;
  roundName?: string;
}

function MatchListItem({
  match,
  showScore = false,
}: {
  match: MatchData;
  showScore?: boolean;
}) {
  return (
    <Link
      href={ROUTES.matchDetail(match.tournamentId, match.id)}
      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="truncate">
              {match.homeTeam?.name ?? 'TBD'}
            </span>
            {showScore ? (
              <span className="shrink-0 font-bold tabular-nums">
                {match.homeScore ?? 0} - {match.awayScore ?? 0}
              </span>
            ) : (
              <span className="shrink-0 text-muted-foreground">vs</span>
            )}
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
  );
}

function FinancialItem({
  label,
  amount,
  variant,
}: {
  label: string;
  amount: number;
  variant: 'default' | 'success' | 'warning' | 'destructive';
}) {
  const colorMap = {
    default: 'text-foreground',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    destructive: 'text-red-600',
  };

  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn('text-xl font-bold', colorMap[variant])}>
        {formatVND(amount)}
      </p>
    </div>
  );
}

function OrganizerDashboardSkeleton() {
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
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-5 w-32" />
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-14 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
