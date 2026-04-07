'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SUBMIT_MATCH_RESULT } from '@/graphql/mutations/match';
import { GET_MATCH } from '@/graphql/queries/match';

interface MatchTeam {
  id: string;
  name: string;
}

interface MatchSet {
  id: string;
  setNumber: number;
  homeScore: number;
  awayScore: number;
}

interface MatchResultFormProps {
  match: {
    id: string;
    homeTeam?: MatchTeam | null;
    awayTeam?: MatchTeam | null;
    homeScore?: number | null;
    awayScore?: number | null;
    sets?: MatchSet[] | null;
  };
  tournamentSport: string;
}

interface SetScore {
  homeScore: number;
  awayScore: number;
}

export function MatchResultForm({ match, tournamentSport }: MatchResultFormProps) {
  const isSetBased = tournamentSport === 'volleyball' || tournamentSport === 'badminton';

  const [homeScore, setHomeScore] = useState(match.homeScore ?? 0);
  const [awayScore, setAwayScore] = useState(match.awayScore ?? 0);
  const [sets, setSets] = useState<SetScore[]>(() => {
    if (match.sets && match.sets.length > 0) {
      return match.sets
        .sort((a, b) => a.setNumber - b.setNumber)
        .map((s) => ({ homeScore: s.homeScore, awayScore: s.awayScore }));
    }
    if (isSetBased) {
      return [{ homeScore: 0, awayScore: 0 }];
    }
    return [];
  });

  const [submitResult, { loading }] = useMutation(SUBMIT_MATCH_RESULT, {
    refetchQueries: [{ query: GET_MATCH, variables: { id: match.id } }],
  });

  function handleAddSet() {
    setSets((prev) => [...prev, { homeScore: 0, awayScore: 0 }]);
  }

  function handleRemoveSet(index: number) {
    setSets((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSetChange(
    index: number,
    field: 'homeScore' | 'awayScore',
    value: number
  ) {
    setSets((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  function validateSets(): string | null {
    if (!isSetBased) return null;

    const maxSets = tournamentSport === 'volleyball' ? 5 : 3;
    if (sets.length > maxSets) {
      return `Tối đa ${maxSets} set cho ${tournamentSport === 'volleyball' ? 'bóng chuyền' : 'cầu lông'}.`;
    }

    for (let i = 0; i < sets.length; i++) {
      const set = sets[i];
      const isFinalSet = tournamentSport === 'volleyball' && i === 4;
      const targetPoints = isFinalSet
        ? 15
        : tournamentSport === 'volleyball'
          ? 25
          : 21;
      const maxPoints = tournamentSport === 'badminton' ? 30 : Infinity;

      const winnerScore = Math.max(set.homeScore, set.awayScore);
      const loserScore = Math.min(set.homeScore, set.awayScore);

      if (winnerScore < targetPoints) {
        return `Set ${i + 1}: đội thắng cần đạt ít nhất ${targetPoints} điểm.`;
      }

      if (winnerScore - loserScore < 2 && winnerScore < maxPoints) {
        return `Set ${i + 1}: cần chênh lệch ít nhất 2 điểm (hoặc đạt ${maxPoints}).`;
      }
    }

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isSetBased) {
      const error = validateSets();
      if (error) {
        toast.error(error);
        return;
      }
    }

    // For set-based sports, calculate total sets won as homeScore/awayScore
    const input = isSetBased
      ? {
          homeScore: sets.filter((s) => s.homeScore > s.awayScore).length,
          awayScore: sets.filter((s) => s.awayScore > s.homeScore).length,
          sets: sets.map((s, i) => ({
            setNumber: i + 1,
            homeScore: s.homeScore,
            awayScore: s.awayScore,
          })),
        }
      : {
          homeScore,
          awayScore,
        };

    try {
      await submitResult({
        variables: { id: match.id, input },
      });
      toast.success('Gửi kết quả trận đấu thành công.');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Không thể gửi kết quả';
      toast.error(message);
    }
  }

  // Calculate sets won for display
  const homeSetsWon = sets.filter((s) => s.homeScore > s.awayScore).length;
  const awaySetsWon = sets.filter((s) => s.awayScore > s.homeScore).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Gửi kết quả</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSetBased ? (
            <div className="space-y-3">
              <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center text-xs font-medium text-muted-foreground">
                <span className="text-center">
                  {match.homeTeam?.name ?? 'Đội nhà'}
                </span>
                <span />
                <span className="text-center">
                  {match.awayTeam?.name ?? 'Đội khách'}
                </span>
              </div>

              {sets.map((set, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center"
                >
                  <Input
                    type="number"
                    min={0}
                    value={set.homeScore}
                    onChange={(e) =>
                      handleSetChange(idx, 'homeScore', parseInt(e.target.value) || 0)
                    }
                    className="text-center"
                  />
                  <span className="text-xs text-muted-foreground w-10 text-center">
                    Set {idx + 1}
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={set.awayScore}
                    onChange={(e) =>
                      handleSetChange(idx, 'awayScore', parseInt(e.target.value) || 0)
                    }
                    className="text-center"
                  />
                  {sets.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRemoveSet(idx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}

              {/* Sets won summary */}
              <div className="flex justify-center gap-4 text-sm font-semibold">
                <span>{homeSetsWon}</span>
                <span className="text-muted-foreground">-</span>
                <span>{awaySetsWon}</span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSet}
                className="w-full"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Thêm set
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-end">
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    {match.homeTeam?.name ?? 'Đội nhà'}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={homeScore}
                    onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
                    className="text-center text-lg font-bold"
                  />
                </div>
                <span className="pb-2 text-muted-foreground font-medium">-</span>
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    {match.awayTeam?.name ?? 'Đội khách'}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={awayScore}
                    onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
                    className="text-center text-lg font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          <Separator />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gửi kết quả
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
