'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { Plus, Users, AlertTriangle } from 'lucide-react';

import { cn } from '@/lib/utils/cn';
import { GET_PLAYERS_BY_TEAM } from '@/graphql/queries/player';
import { REMOVE_PLAYER } from '@/graphql/mutations/player';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { PlayerTable } from './player-table';
import { PlayerForm } from './player-form';

interface Player {
  id: string;
  fullName: string;
  jerseyNumber: number | null;
  position: string | null;
  isCaptain: boolean;
  isActive: boolean;
}

interface RosterManagerProps {
  teamId: string;
  minPlayers: number;
  maxPlayers: number;
}

export function RosterManager({
  teamId,
  minPlayers,
  maxPlayers,
}: RosterManagerProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [removeId, setXóaId] = useState<string | null>(null);

  const { data, loading } = useQuery(GET_PLAYERS_BY_TEAM, {
    variables: { teamId },
    skip: !teamId,
  });

  const [removePlayer, { loading: removing }] = useMutation(REMOVE_PLAYER, {
    refetchQueries: [{ query: GET_PLAYERS_BY_TEAM, variables: { teamId } }],
    onCompleted: () => {
      toast.success('Player removed.');
      setXóaId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const players: Player[] = data?.playersByTeam ?? [];
  const activePlayers = players.filter((p) => p.isActive);
  const count = activePlayers.length;
  const isBelowMin = count < minPlayers;
  const isAtMax = count >= maxPlayers;

  function handleEdit(player: Player) {
    setEditPlayer(player);
    setFormOpen(true);
  }

  function handleAdd() {
    setEditPlayer(null);
    setFormOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Roster</span>
          </div>
          <Badge
            variant={isBelowMin ? 'destructive' : 'outline'}
            className="text-xs"
          >
            {count}/{minPlayers} - {maxPlayers} players
          </Badge>
        </div>
        <Button size="sm" onClick={handleAdd} disabled={isAtMax}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm VĐV
        </Button>
      </div>

      {isBelowMin && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Team needs at least {minPlayers} active players. Currently has{' '}
          {count}.
        </div>
      )}

      <PlayerTable
        players={players}
        isLoading={loading}
        onEdit={handleEdit}
        onXóa={(id) => setXóaId(id)}
      />

      <PlayerForm
        open={formOpen}
        onOpenChange={setFormOpen}
        teamId={teamId}
        editPlayer={
          editPlayer
            ? {
                id: editPlayer.id,
                fullName: editPlayer.fullName,
                jerseyNumber: editPlayer.jerseyNumber ?? 0,
                position: editPlayer.position,
              }
            : null
        }
      />

      <ConfirmDialog
        open={!!removeId}
        onOpenChange={(open) => {
          if (!open) setXóaId(null);
        }}
        title="Xóa VĐV"
        description="Are you sure you want to remove this player from the team?"
        variant="destructive"
        confirmLabel="Xóa"
        isLoading={removing}
        onConfirm={() => {
          if (removeId) {
            removePlayer({ variables: { id: removeId } });
          }
        }}
      />
    </div>
  );
}
