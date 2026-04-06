'use client';

import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { Check, Clock, XCircle, Loader2, UserCheck } from 'lucide-react';

import { cn } from '@/lib/utils/cn';
import { GET_MATCH_CHECKIN_STATUS } from '@/graphql/queries/checkin';
import { PLAYER_CHECKIN } from '@/graphql/mutations/checkin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { QrCodeDisplay } from './qr-code-display';
import { LineupPicker } from './lineup-picker';

interface Team {
  id: string;
  name: string;
  players: Array<{
    id: string;
    fullName: string;
    jerseyNumber?: number;
  }>;
}

interface CheckinPanelProps {
  matchId: string;
  teams: [Team, Team];
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive'; icon: typeof Check }> = {
  checked_in: { label: 'Checked In', variant: 'success', icon: Check },
  pending: { label: 'Pending', variant: 'warning', icon: Clock },
  absent: { label: 'Absent', variant: 'destructive', icon: XCircle },
};

export function CheckinPanel({ matchId, teams }: CheckinPanelProps) {
  const { data, loading, refetch } = useQuery(GET_MATCH_CHECKIN_STATUS, {
    variables: { matchId },
    pollInterval: 10000,
  });

  const [playerCheckin, { loading: checkingIn }] = useMutation(PLAYER_CHECKIN, {
    onCompleted: () => {
      toast.success('Player checked in.');
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const checkinStatus = data?.matchCheckinStatus;
  const checkins = checkinStatus?.checkins ?? [];
  const qrCode = checkinStatus?.qrCode;

  function getPlayerStatus(playerId: string) {
    const checkin = checkins.find(
      (c: { playerId: string; status: string; isStarting: boolean }) => c.playerId === playerId
    );
    return checkin ? { status: checkin.status as string, isStarting: checkin.isStarting as boolean } : null;
  }

  function getCheckedInPlayers(teamId: string) {
    return checkins
      .filter(
        (c: { teamId: string; status: string; playerId: string; isStarting: boolean }) =>
          c.teamId === teamId && c.status === 'checked_in'
      )
      .map((c: { playerId: string; isStarting: boolean }) => {
        const team = teams.find((t) => t.id === teamId);
        const player = team?.players.find((p) => p.id === c.playerId);
        return {
          playerId: c.playerId,
          fullName: player?.fullName ?? 'Unknown',
          jerseyNumber: player?.jerseyNumber,
          isStarting: c.isStarting,
        };
      });
  }

  async function handleCheckin(playerId: string) {
    await playerCheckin({ variables: { matchId, playerId } });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {teams.map((team) => (
          <div key={team.id} className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              {team.name}
            </h3>
            <div className="space-y-2">
              {team.players.map((player) => {
                const checkinInfo = getPlayerStatus(player.id);
                const status = checkinInfo?.status ?? 'pending';
                const config = statusConfig[status] ?? statusConfig.pending;

                return (
                  <div
                    key={player.id}
                    className={cn(
                      'flex items-center justify-between rounded-lg border px-3 py-2',
                      status === 'checked_in' && 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {player.jerseyNumber != null && (
                        <span className="text-xs font-mono font-bold text-muted-foreground w-6 text-right">
                          #{player.jerseyNumber}
                        </span>
                      )}
                      <span className="text-sm truncate">{player.fullName}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={config.variant} className="text-[10px]">
                        {config.label}
                      </Badge>
                      {status !== 'checked_in' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          disabled={checkingIn}
                          onClick={() => handleCheckin(player.id)}
                        >
                          {checkingIn ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Check In'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <LineupPicker
              matchId={matchId}
              teamId={team.id}
              checkedInPlayers={getCheckedInPlayers(team.id)}
            />
          </div>
        ))}
      </div>

      {qrCode && (
        <div className="flex justify-center">
          <QrCodeDisplay qrCode={qrCode} />
        </div>
      )}
    </div>
  );
}
