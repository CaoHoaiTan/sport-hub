'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { ADD_PLAYER, UPDATE_PLAYER } from '@/graphql/mutations/player';
import { GET_PLAYERS_BY_TEAM } from '@/graphql/queries/player';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

interface PlayerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  editPlayer?: {
    id: string;
    fullName: string;
    jerseyNumber: number;
    position: string | null;
  } | null;
}

const positions = [
  'goalkeeper',
  'defender',
  'midfielder',
  'forward',
  'setter',
  'libero',
  'outside_hitter',
  'middle_blocker',
  'opposite',
  'singles',
  'doubles',
];

export function PlayerForm({
  open,
  onOpenChange,
  teamId,
  editPlayer,
}: PlayerFormProps) {
  const [fullName, setFullName] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [position, setPosition] = useState<string>('');

  useEffect(() => {
    if (editPlayer) {
      setFullName(editPlayer.fullName);
      setJerseyNumber(String(editPlayer.jerseyNumber));
      setPosition(editPlayer.position ?? '');
    } else {
      setFullName('');
      setJerseyNumber('');
      setPosition('');
    }
  }, [editPlayer]);

  const [addPlayer, { loading: adding }] = useMutation(ADD_PLAYER, {
    refetchQueries: [{ query: GET_PLAYERS_BY_TEAM, variables: { teamId } }],
  });

  const [updatePlayer, { loading: updating }] = useMutation(UPDATE_PLAYER, {
    refetchQueries: [{ query: GET_PLAYERS_BY_TEAM, variables: { teamId } }],
  });

  const isLoading = adding || updating;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (editPlayer) {
        await updatePlayer({
          variables: {
            id: editPlayer.id,
            input: {
              fullName,
              jerseyNumber: parseInt(jerseyNumber, 10),
              position: position || null,
            },
          },
        });
        toast.success('Player updated.');
      } else {
        await addPlayer({
          variables: {
            input: {
              teamId,
              fullName,
              jerseyNumber: parseInt(jerseyNumber, 10),
              position: position || null,
            },
          },
        });
        toast.success('Player added.');
      }
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Operation failed';
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editPlayer ? 'Edit Player' : 'Thêm VĐV'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="player-name">Full Name</Label>
            <Input
              id="player-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jersey-number">Số áo</Label>
            <Input
              id="jersey-number"
              type="number"
              value={jerseyNumber}
              onChange={(e) => setJerseyNumber(e.target.value)}
              required
              min={0}
              max={99}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="player-position">Vị trí (optional)</Label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger>
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {positions.map((pos) => (
                  <SelectItem key={pos} value={pos}>
                    <span className="capitalize">{pos.replace('_', ' ')}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Hủy
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editPlayer ? 'Update' : 'Thêm VĐV'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
