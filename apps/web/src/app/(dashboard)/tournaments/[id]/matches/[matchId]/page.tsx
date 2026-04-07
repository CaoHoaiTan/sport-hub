'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { ArrowLeft, Clock, MapPin, User } from 'lucide-react';

import { useAuth } from '@/lib/auth/context';
import { canScoreMatch } from '@/lib/utils/roles';
import { formatDateTime } from '@/lib/utils/format';
import { ROUTES } from '@/lib/constants';
import { GET_MATCH } from '@/graphql/queries/match';
import { GET_TOURNAMENT } from '@/graphql/queries/tournament';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LiveScoreBoard } from '@/components/match/live-score-board';
import { MatchResultForm } from '@/components/match/match-result-form';
import { MatchEventForm } from '@/components/match/match-event-form';
import { MatchEventFeed } from '@/components/match/match-event-feed';

export default function MatchDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const tournamentId = params.id as string;
  const matchId = params.matchId as string;

  const { data, loading } = useQuery(GET_MATCH, {
    variables: { id: matchId },
    skip: !matchId,
  });

  const { data: tournamentData } = useQuery(GET_TOURNAMENT, {
    variables: { id: tournamentId },
    skip: !tournamentId,
  });

  const match = data?.match;
  const tournament = tournamentData?.tournament;
  const canScore = user && canScoreMatch(user.role);
  const hasSets = match?.sets && match.sets.length > 0;
  const isActive = match?.status === 'live' || match?.status === 'scheduled' || match?.status === 'checkin_open';
  const isCompleted = match?.status === 'completed';
  const canEdit = isCompleted && user && (user.role === 'admin' || user.role === 'organizer');

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Không tìm thấy trận đấu.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={ROUTES.tournamentSchedule(tournamentId)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại lịch thi đấu
          </Link>
        </Button>
      </div>

      <LiveScoreBoard match={match} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Match Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {match.roundName && (
                  <InfoItem icon={User} label="Round" value={match.roundName} />
                )}
                {match.scheduledAt && (
                  <InfoItem
                    icon={Clock}
                    label="Scheduled"
                    value={formatDateTime(match.scheduledAt)}
                  />
                )}
                {match.venue && (
                  <InfoItem
                    icon={MapPin}
                    label="Venue"
                    value={match.venue.name}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {hasSets && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sets</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Set</TableHead>
                      <TableHead className="text-center">
                        {match.homeTeam?.name ?? 'Home'}
                      </TableHead>
                      <TableHead className="text-center">
                        {match.awayTeam?.name ?? 'Away'}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...match.sets]
                      .sort(
                        (a: { setNumber: number }, b: { setNumber: number }) =>
                          a.setNumber - b.setNumber
                      )
                      .map(
                        (set: {
                          id: string;
                          setNumber: number;
                          homeScore: number;
                          awayScore: number;
                        }) => (
                          <TableRow key={set.id}>
                            <TableCell className="font-medium">
                              Set {set.setNumber}
                            </TableCell>
                            <TableCell className="text-center tabular-nums font-semibold">
                              {set.homeScore}
                            </TableCell>
                            <TableCell className="text-center tabular-nums font-semibold">
                              {set.awayScore}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sự kiện trận đấu</CardTitle>
            </CardHeader>
            <CardContent>
              <MatchEventFeed events={match.events ?? []} />
            </CardContent>
          </Card>
        </div>

        {((canScore && isActive) || canEdit) && (
          <div className="space-y-6">
            {canEdit && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3">
                <span>Trận đấu đã hoàn thành. Bạn có thể sửa kết quả.</span>
              </div>
            )}
            <MatchResultForm
              match={match}
              tournamentSport={tournament?.sport ?? 'football'}
            />

            {isActive && (
              <>
                <Separator />
                <MatchEventForm
                  matchId={match.id}
                  sport={tournament?.sport}
                  teams={{
                    home: match.homeTeam
                      ? { ...match.homeTeam, players: [] }
                      : null,
                    away: match.awayTeam
                      ? { ...match.awayTeam, players: [] }
                      : null,
                  }}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
