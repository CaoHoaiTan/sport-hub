'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { Loader2, SendHorizonal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ADD_MATCH_EVENT } from '@/graphql/mutations/match';
import { GET_MATCH } from '@/graphql/queries/match';

interface Player {
  id: string;
  fullName: string;
  jerseyNumber?: number | null;
}

interface Team {
  id: string;
  name: string;
  players?: Player[];
}

interface MatchEventFormProps {
  matchId: string;
  sport?: string;
  teams: {
    home?: Team | null;
    away?: Team | null;
  };
}

const eventTypesBySport: Record<string, { value: string; label: string }[]> = {
  football: [
    { value: 'goal', label: 'Bàn thắng' },
    { value: 'assist', label: 'Kiến tạo' },
    { value: 'yellow_card', label: 'Thẻ vàng' },
    { value: 'red_card', label: 'Thẻ đỏ' },
    { value: 'substitution', label: 'Thay người' },
    { value: 'penalty', label: 'Phạt đền' },
    { value: 'own_goal', label: 'Phản lưới' },
  ],
  volleyball: [
    { value: 'point', label: 'Ghi điểm' },
    { value: 'ace', label: 'Giao bóng trực tiếp (Ace)' },
    { value: 'block', label: 'Chắn bóng' },
    { value: 'substitution', label: 'Thay người' },
    { value: 'timeout', label: 'Hội ý (Timeout)' },
  ],
  badminton: [
    { value: 'point', label: 'Ghi điểm' },
    { value: 'timeout', label: 'Nghỉ giữa set' },
  ],
};

export function MatchEventForm({ matchId, sport, teams }: MatchEventFormProps) {
  const [eventType, setEventType] = useState('');
  const [teamId, setTeamId] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [minute, setMinute] = useState('');
  const [setNumber, setSetNumber] = useState('');
  const [description, setDescription] = useState('');

  const [addEvent, { loading }] = useMutation(ADD_MATCH_EVENT, {
    refetchQueries: [{ query: GET_MATCH, variables: { id: matchId } }],
  });

  const eventTypes = eventTypesBySport[sport ?? 'football'] ?? eventTypesBySport.football;
  const isSetSport = sport === 'volleyball' || sport === 'badminton';

  const selectedTeam =
    teamId === teams.home?.id ? teams.home : teamId === teams.away?.id ? teams.away : null;
  const availablePlayers = selectedTeam?.players ?? [];
  const teamOptions = [teams.home, teams.away].filter(Boolean) as Team[];

  function resetForm() {
    setEventType('');
    setTeamId('');
    setPlayerId('');
    setMinute('');
    setSetNumber('');
    setDescription('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!eventType || !teamId) {
      toast.error('Vui lòng chọn loại sự kiện và đội.');
      return;
    }

    const input: Record<string, unknown> = {
      eventType,
      teamId,
    };

    if (playerId) input.playerId = playerId;
    if (minute) input.minute = parseInt(minute);
    if (setNumber) input.setNumber = parseInt(setNumber);
    if (description) input.description = description;

    try {
      await addEvent({ variables: { matchId, input } });
      toast.success('Đã thêm sự kiện.');
      resetForm();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Thêm sự kiện thất bại';
      toast.error(message);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Thêm sự kiện</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Loại sự kiện</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn sự kiện" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((et) => (
                    <SelectItem key={et.value} value={et.value}>
                      {et.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Đội</Label>
              <Select
                value={teamId}
                onValueChange={(val) => {
                  setTeamId(val);
                  setPlayerId('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn đội" />
                </SelectTrigger>
                <SelectContent>
                  {teamOptions.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {availablePlayers.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">VĐV (tùy chọn)</Label>
                <Select value={playerId} onValueChange={setPlayerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn VĐV" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không chọn</SelectItem>
                    {availablePlayers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.jerseyNumber != null ? `#${p.jerseyNumber} ` : ''}
                        {p.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {isSetSport ? (
              <div className="space-y-1.5">
                <Label className="text-xs">Set</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={setNumber}
                  onChange={(e) => setSetNumber(e.target.value)}
                  placeholder="Số set"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs">Phút</Label>
                <Input
                  type="number"
                  min={0}
                  max={200}
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  placeholder="VD: 45"
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Mô tả (tùy chọn)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Chi tiết thêm..."
              rows={2}
            />
          </div>

          <Button type="submit" size="sm" disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <SendHorizonal className="mr-2 h-3.5 w-3.5" />
            )}
            Thêm sự kiện
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
