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
  teams: {
    home?: Team | null;
    away?: Team | null;
  };
}

const EVENT_TYPES = [
  { value: 'goal', label: 'Goal' },
  { value: 'assist', label: 'Assist' },
  { value: 'yellow_card', label: 'Yellow Card' },
  { value: 'red_card', label: 'Red Card' },
  { value: 'substitution', label: 'Substitution' },
  { value: 'penalty', label: 'Penalty' },
  { value: 'own_goal', label: 'Own Goal' },
  { value: 'point', label: 'Point' },
];

export function MatchEventForm({ matchId, teams }: MatchEventFormProps) {
  const [eventType, setEventType] = useState('');
  const [teamId, setTeamId] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [minute, setMinute] = useState('');
  const [description, setDescription] = useState('');

  const [addEvent, { loading }] = useMutation(ADD_MATCH_EVENT, {
    refetchQueries: [{ query: GET_MATCH, variables: { id: matchId } }],
  });

  const selectedTeam =
    teamId === teams.home?.id ? teams.home : teamId === teams.away?.id ? teams.away : null;

  const availablePlayers = selectedTeam?.players ?? [];

  const teamOptions = [teams.home, teams.away].filter(Boolean) as Team[];

  function resetForm() {
    setEventType('');
    setTeamId('');
    setPlayerId('');
    setMinute('');
    setDescription('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!eventType || !teamId) {
      toast.error('Please select event type and team.');
      return;
    }

    const input: Record<string, unknown> = {
      eventType,
      teamId,
    };

    if (playerId) input.playerId = playerId;
    if (minute) input.minute = parseInt(minute);
    if (description) input.description = description;

    try {
      await addEvent({
        variables: { matchId, input },
      });
      toast.success('Event added.');
      resetForm();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to add event';
      toast.error(message);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add Match Event</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Event Type</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((et) => (
                    <SelectItem key={et.value} value={et.value}>
                      {et.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Team</Label>
              <Select
                value={teamId}
                onValueChange={(val) => {
                  setTeamId(val);
                  setPlayerId('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
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

            <div className="space-y-1.5">
              <Label className="text-xs">Player (optional)</Label>
              <Select value={playerId} onValueChange={setPlayerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select player" />
                </SelectTrigger>
                <SelectContent>
                  {availablePlayers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.jerseyNumber != null ? `#${p.jerseyNumber} ` : ''}
                      {p.fullName}
                    </SelectItem>
                  ))}
                  {availablePlayers.length === 0 && (
                    <SelectItem value="__none" disabled>
                      No players available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Minute (optional)</Label>
              <Input
                type="number"
                min={0}
                max={200}
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
                placeholder="e.g. 45"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details..."
              rows={2}
            />
          </div>

          <Button type="submit" size="sm" disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <SendHorizonal className="mr-2 h-3.5 w-3.5" />
            )}
            Add Event
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
