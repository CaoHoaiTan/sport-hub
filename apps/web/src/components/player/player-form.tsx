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
  sport?: string;
  editPlayer?: {
    id: string;
    fullName: string;
    jerseyNumber: number;
    position: string | null;
  } | null;
}

const positionsBySport: Record<string, { value: string; label: string }[]> = {
  football: [
    { value: 'goalkeeper', label: 'Thủ môn' },
    { value: 'defender', label: 'Hậu vệ' },
    { value: 'midfielder', label: 'Tiền vệ' },
    { value: 'forward', label: 'Tiền đạo' },
  ],
  volleyball: [
    { value: 'setter', label: 'Chuyền hai' },
    { value: 'libero', label: 'Libero' },
    { value: 'outside_hitter', label: 'Chủ công' },
    { value: 'middle_blocker', label: 'Phụ công' },
    { value: 'opposite', label: 'Đối chuyền' },
  ],
  badminton: [
    { value: 'singles', label: 'Đơn' },
    { value: 'doubles', label: 'Đôi' },
  ],
};

export function PlayerForm({
  open,
  onOpenChange,
  teamId,
  sport,
  editPlayer,
}: PlayerFormProps) {
  const [fullName, setFullName] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [position, setPosition] = useState<string>('none');

  useEffect(() => {
    if (editPlayer) {
      setFullName(editPlayer.fullName);
      setJerseyNumber(String(editPlayer.jerseyNumber));
      setPosition(editPlayer.position ?? 'none');
    } else {
      setFullName('');
      setJerseyNumber('');
      setPosition('none');
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
              position: position && position !== 'none' ? position : null,
            },
          },
        });
        toast.success('Cập nhật thành công.');
      } else {
        await addPlayer({
          variables: {
            input: {
              teamId,
              fullName,
              jerseyNumber: parseInt(jerseyNumber, 10),
              position: position && position !== 'none' ? position : null,
            },
          },
        });
        toast.success('Thêm vận động viên thành công.');
      }
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Thao tác thất bại';
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editPlayer ? 'Sửa thông tin VĐV' : 'Thêm VĐV'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="player-name">Họ tên</Label>
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
            <Label htmlFor="player-position">Vị trí (tùy chọn)</Label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn vị trí" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không chọn</SelectItem>
                {(positionsBySport[sport ?? ''] ?? Object.values(positionsBySport).flat()).map((pos) => (
                  <SelectItem key={pos.value} value={pos.value}>
                    {pos.label}
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
