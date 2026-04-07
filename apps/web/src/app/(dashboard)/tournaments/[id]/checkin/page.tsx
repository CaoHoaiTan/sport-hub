'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import {
  QrCode,
  ChevronDown,
  ChevronUp,
  Loader2,
  LockOpen,
  Lock,
} from 'lucide-react';

import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/auth/context';
import { isOrganizer, canScoreMatch } from '@/lib/utils/roles';
import { formatDateTime } from '@/lib/utils/format';
import { GET_MATCHES_BY_TOURNAMENT } from '@/graphql/queries/match';
import { GET_TEAMS_BY_TOURNAMENT } from '@/graphql/queries/team';
import { OPEN_CHECKIN, CLOSE_CHECKIN } from '@/graphql/mutations/checkin';
import { GET_MATCH_CHECKIN_STATUS } from '@/graphql/queries/checkin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { CheckinPanel } from '@/components/checkin/checkin-panel';

export default function CheckinPage() {
  const params = useParams();
  const { user } = useAuth();
  const tournamentId = params.id as string;
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  const { data: matchesData, loading: matchesLoading } = useQuery(
    GET_MATCHES_BY_TOURNAMENT,
    { variables: { tournamentId }, skip: !tournamentId }
  );

  const { data: teamsData } = useQuery(GET_TEAMS_BY_TOURNAMENT, {
    variables: { tournamentId },
    skip: !tournamentId,
  });

  const canManageCheckin = user && (isOrganizer(user.role) || canScoreMatch(user.role));

  const matches = matchesData?.matchesByTournament ?? [];
  const teams = teamsData?.teamsByTournament ?? [];

  if (matchesLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <EmptyState
        icon={QrCode}
        title="Chưa có trận đấu"
        description="Tạo lịch thi đấu ở tab Lịch thi đấu trước khi quản lý check-in."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Check-in trận đấu</h2>
          <p className="text-sm text-muted-foreground">
            Quản lý điểm danh và đội hình cho từng trận đấu.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {matches.map((match: Record<string, unknown>) => (
          <MatchCheckinRow
            key={match.id as string}
            match={match}
            teams={teams}
            isExpanded={expandedMatchId === match.id}
            onToggle={() =>
              setExpandedMatchId(
                expandedMatchId === match.id ? null : (match.id as string)
              )
            }
            canManage={!!canManageCheckin}
          />
        ))}
      </div>
    </div>
  );
}

function MatchCheckinRow({
  match,
  teams,
  isExpanded,
  onToggle,
  canManage,
}: {
  match: Record<string, unknown>;
  teams: Array<Record<string, unknown>>;
  isExpanded: boolean;
  onToggle: () => void;
  canManage: boolean;
}) {
  const matchId = match.id as string;

  const { data: statusData } = useQuery(GET_MATCH_CHECKIN_STATUS, {
    variables: { matchId },
    skip: !isExpanded && !canManage,
  });

  const [openCheckin, { loading: opening }] = useMutation(OPEN_CHECKIN, {
    variables: { matchId },
    refetchQueries: [{ query: GET_MATCH_CHECKIN_STATUS, variables: { matchId } }],
    onCompleted: () => toast.success('Check-in opened.'),
    onError: (err) => toast.error(err.message),
  });

  const [closeCheckin, { loading: closing }] = useMutation(CLOSE_CHECKIN, {
    variables: { matchId },
    refetchQueries: [{ query: GET_MATCH_CHECKIN_STATUS, variables: { matchId } }],
    onCompleted: () => toast.success('Check-in closed.'),
    onError: (err) => toast.error(err.message),
  });

  const isOpen = statusData?.matchCheckinStatus?.isOpen ?? false;
  const homeTeam = match.homeTeam as { id: string; name: string } | null;
  const awayTeam = match.awayTeam as { id: string; name: string } | null;

  function getTeamWithPlayers(teamRef: { id: string; name: string } | null) {
    if (!teamRef) return null;
    const full = teams.find((t) => (t.id as string) === teamRef.id) as Record<string, unknown> | undefined;
    return {
      id: teamRef.id,
      name: teamRef.name,
      players: ((full?.players as Array<Record<string, unknown>>) ?? []).map((p) => ({
        id: p.id as string,
        fullName: p.fullName as string,
        jerseyNumber: p.jerseyNumber as number | undefined,
      })),
    };
  }

  const homeWithPlayers = getTeamWithPlayers(homeTeam);
  const awayWithPlayers = getTeamWithPlayers(awayTeam);

  return (
    <Card>
      <CardContent className="p-0">
        <div
          role="button"
          tabIndex={0}
          className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={onToggle}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggle(); }}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">
                {homeTeam?.name ?? 'TBD'} vs {awayTeam?.name ?? 'TBD'}
              </span>
              {match.roundName ? (
                <Badge variant="outline" className="text-[10px]">
                  {String(match.roundName)}
                </Badge>
              ) : null}
            </div>
            {match.scheduledAt ? (
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDateTime(match.scheduledAt as string)}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={isOpen ? 'success' : 'secondary'} className="text-[10px]">
              {isOpen ? 'Đang mở' : 'Đã đóng'}
            </Badge>
            {canManage && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={opening || closing}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isOpen) {
                    closeCheckin();
                  } else {
                    openCheckin();
                  }
                }}
              >
                {opening || closing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : isOpen ? (
                  <>
                    <Lock className="mr-1 h-3 w-3" />
                    Đóng
                  </>
                ) : (
                  <>
                    <LockOpen className="mr-1 h-3 w-3" />
                    Mở
                  </>
                )}
              </Button>
            )}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {isExpanded && homeWithPlayers && awayWithPlayers && (
          <div className="border-t p-4">
            <CheckinPanel
              matchId={matchId}
              teams={[homeWithPlayers, awayWithPlayers]}
            />
          </div>
        )}

        {isExpanded && (!homeWithPlayers || !awayWithPlayers) && (
          <div className="border-t p-4 text-center text-sm text-muted-foreground">
            Chưa có đội được phân vào trận đấu này.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
