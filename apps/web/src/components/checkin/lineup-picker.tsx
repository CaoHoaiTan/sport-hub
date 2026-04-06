'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { Users, Loader2 } from 'lucide-react';

import { SET_LINEUP } from '@/graphql/mutations/checkin';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Player {
  playerId: string;
  fullName: string;
  jerseyNumber?: number;
  isStarting: boolean;
}

interface LineupPickerProps {
  matchId: string;
  teamId: string;
  checkedInPlayers: Player[];
}

export function LineupPicker({
  matchId,
  teamId,
  checkedInPlayers,
}: LineupPickerProps) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(checkedInPlayers.filter((p) => p.isStarting).map((p) => p.playerId))
  );

  const [setLineup, { loading }] = useMutation(SET_LINEUP);

  function handleToggle(playerId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  }

  async function handleSubmit() {
    try {
      await setLineup({
        variables: {
          input: {
            matchId,
            teamId,
            playerIds: Array.from(selected),
          },
        },
      });
      toast.success('Lineup set successfully.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to set lineup';
      toast.error(message);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Starting Lineup</span>
          <span className="text-xs font-normal text-muted-foreground">
            {selected.size}/{checkedInPlayers.length} starting
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {checkedInPlayers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No players have checked in yet.
          </p>
        ) : (
          <div className="space-y-2">
            {checkedInPlayers.map((player) => (
              <label
                key={player.playerId}
                className="flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={selected.has(player.playerId)}
                  onCheckedChange={() => handleToggle(player.playerId)}
                />
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {player.jerseyNumber != null && (
                    <span className="text-xs font-mono font-bold text-muted-foreground w-6 text-right">
                      #{player.jerseyNumber}
                    </span>
                  )}
                  <span className="text-sm truncate">{player.fullName}</span>
                </div>
              </label>
            ))}
          </div>
        )}
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={loading || checkedInPlayers.length === 0}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Users className="mr-2 h-4 w-4" />
          )}
          Set Lineup
        </Button>
      </CardContent>
    </Card>
  );
}
