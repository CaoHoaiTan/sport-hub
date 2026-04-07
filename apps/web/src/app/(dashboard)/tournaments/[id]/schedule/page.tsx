'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { CalendarDays, Loader2, Wand2, Clock } from 'lucide-react';

import { useAuth } from '@/lib/auth/context';
import { isOrganizer } from '@/lib/utils/roles';
import { GET_MATCHES_BY_TOURNAMENT } from '@/graphql/queries/match';
import { GET_TOURNAMENT } from '@/graphql/queries/tournament';
import { GET_VENUES } from '@/graphql/queries/venue';
import { GENERATE_MATCHES, UPDATE_MATCH_SCHEDULE } from '@/graphql/mutations/match';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MatchSchedule } from '@/components/match/match-schedule';
import { BracketView } from '@/components/match/bracket-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ELIMINATION_FORMATS = ['single_elimination', 'double_elimination'];
const GROUP_KNOCKOUT_FORMAT = 'group_stage_knockout';

export default function TournamentSchedulePage() {
  const params = useParams();
  const { user } = useAuth();
  const tournamentId = params.id as string;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showScheduleEditor, setShowScheduleEditor] = useState(false);

  const { data: tournamentData } = useQuery(GET_TOURNAMENT, {
    variables: { id: tournamentId },
    skip: !tournamentId,
  });

  const { data, loading } = useQuery(GET_MATCHES_BY_TOURNAMENT, {
    variables: { tournamentId },
    skip: !tournamentId,
  });

  const [generateMatches, { loading: generating }] = useMutation(
    GENERATE_MATCHES,
    {
      variables: { tournamentId },
      refetchQueries: [
        { query: GET_MATCHES_BY_TOURNAMENT, variables: { tournamentId } },
      ],
    }
  );

  const tournamentSport = tournamentData?.tournament?.sport;
  const { data: venuesData } = useQuery(GET_VENUES, {
    variables: { sportType: tournamentSport },
    skip: !user || !isOrganizer(user?.role) || !tournamentSport,
  });

  const [updateSchedule, { loading: scheduling }] = useMutation(
    UPDATE_MATCH_SCHEDULE,
    {
      refetchQueries: [
        { query: GET_MATCHES_BY_TOURNAMENT, variables: { tournamentId } },
      ],
    }
  );

  const [scheduleMatchId, setScheduleMatchId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleVenueId, setScheduleVenueId] = useState('');

  const tournament = tournamentData?.tournament;
  const matches = data?.matchesByTournament ?? [];
  const venues = venuesData?.venues ?? [];
  const canManage = user && isOrganizer(user.role);

  const format = tournament?.format ?? '';
  const isElimination = ELIMINATION_FORMATS.includes(format);
  const isGroupKnockout = format === GROUP_KNOCKOUT_FORMAT;

  async function handleGenerate() {
    try {
      await generateMatches();
      toast.success('Đã tạo lịch thi đấu.');
      setDialogOpen(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Tạo lịch thất bại';
      toast.error(message);
    }
  }

  function openScheduleDialog(matchId: string, currentScheduledAt?: string | null, currentVenueId?: string | null) {
    setScheduleMatchId(matchId);
    setScheduleDate(currentScheduledAt ? toDatetimeLocal(currentScheduledAt) : '');
    setScheduleVenueId(currentVenueId ?? 'none');
  }

  async function handleSchedule() {
    if (!scheduleMatchId) return;
    try {
      await updateSchedule({
        variables: {
          id: scheduleMatchId,
          input: {
            scheduledAt: scheduleDate ? new Date(scheduleDate).toISOString() : null,
            venueId: scheduleVenueId && scheduleVenueId !== 'none' ? scheduleVenueId : null,
          },
        },
      });
      toast.success('Đã cập nhật lịch trận đấu.');
      setScheduleMatchId(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Cập nhật thất bại';
      toast.error(message);
    }
  }

  function toDatetimeLocal(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const hasMatches = matches.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Lịch thi đấu</h2>
        </div>

        <div className="flex gap-2">
        {canManage && hasMatches && (
          <Button
            variant="outline"
            onClick={() => setShowScheduleEditor((v) => !v)}
          >
            <Clock className="mr-2 h-4 w-4" />
            {showScheduleEditor ? 'Ẩn lên lịch' : 'Lên lịch trận đấu'}
          </Button>
        )}
        {canManage && !hasMatches && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Wand2 className="mr-2 h-4 w-4" />
                Tạo lịch thi đấu
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo lịch thi đấu</DialogTitle>
                <DialogDescription>
                  Hệ thống sẽ tự động tạo lịch thi đấu dựa trên thể thức và
                  các đội đã đăng ký.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Hủy</Button>
                </DialogClose>
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Tạo lịch
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        </div>
      </div>

      {/* Schedule editor — shown when toggled */}
      {canManage && hasMatches && showScheduleEditor && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Lên lịch trận đấu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {matches
              .filter((m: Record<string, unknown>) => m.homeTeam && m.awayTeam)
              .map((m: Record<string, unknown>) => {
                const home = m.homeTeam as { name: string } | null;
                const away = m.awayTeam as { name: string } | null;
                const venue = m.venue as { id: string; name: string } | null;
                const roundLabel = (m.roundName as string) ?? `Vòng ${m.round}`;
                return (
                  <div
                    key={m.id as string}
                    className="grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-1 items-center rounded-lg border px-3 py-2.5 text-sm"
                  >
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {roundLabel}
                    </Badge>
                    <span className="font-medium truncate">
                      {home?.name ?? 'TBD'} vs {away?.name ?? 'TBD'}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs shrink-0"
                      onClick={() =>
                        openScheduleDialog(
                          m.id as string,
                          m.scheduledAt as string | null,
                          venue?.id
                        )
                      }
                    >
                      {m.scheduledAt ? 'Sửa' : 'Chọn thời gian'}
                    </Button>
                    <div className="col-start-2 col-span-1 flex gap-3 text-xs text-muted-foreground">
                      <span>
                        {m.scheduledAt
                          ? new Date(m.scheduledAt as string).toLocaleString('vi-VN')
                          : 'Chưa lên lịch'}
                      </span>
                      {venue && <span>{venue.name}</span>}
                    </div>
                  </div>
                );
              })}
            {matches.filter((m: Record<string, unknown>) => m.homeTeam && m.awayTeam).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Chưa có trận nào được phân đội. Các trận sẽ được cập nhật khi có kết quả vòng trước.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {!hasMatches ? (
        <div className="text-center py-16 space-y-2">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground">
            Chưa có trận đấu nào được lên lịch.
          </p>
          {canManage && (
            <p className="text-sm text-muted-foreground">
              Nhấn &quot;Tạo lịch thi đấu&quot; để tạo lịch tự động.
            </p>
          )}
        </div>
      ) : isElimination ? (
        <BracketView
          matches={matches}
          tournamentId={tournamentId}
          variant={format === 'double_elimination' ? 'double' : 'single'}
        />
      ) : isGroupKnockout ? (
        <GroupKnockoutView
          matches={matches}
          tournamentId={tournamentId}
          format={format}
        />
      ) : (
        <MatchSchedule matches={matches} tournamentId={tournamentId} />
      )}

      {/* Schedule dialog */}
      <Dialog
        open={scheduleMatchId !== null}
        onOpenChange={(open) => { if (!open) setScheduleMatchId(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lên lịch trận đấu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Thời gian</Label>
              <Input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Địa điểm</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={scheduleVenueId}
                onChange={(e) => setScheduleVenueId(e.target.value)}
              >
                <option value="none">Không chọn</option>
                {(venues as Array<{ id: string; name: string }>).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setScheduleMatchId(null)}
            >
              Hủy
            </Button>
            <Button onClick={handleSchedule} disabled={scheduling}>
              {scheduling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GroupKnockoutView({
  matches,
  tournamentId,
}: {
  matches: Array<{
    id: string;
    tournamentId: string;
    round?: number | null;
    roundName?: string | null;
    groupName?: string | null;
    bracketPosition?: number | null;
    scheduledAt?: string | null;
    status: string;
    homeScore?: number | null;
    awayScore?: number | null;
    homeTeam?: { id: string; name: string; logoUrl?: string | null } | null;
    awayTeam?: { id: string; name: string; logoUrl?: string | null } | null;
    venue?: { id: string; name: string } | null;
    sets?: { id: string; setNumber: number; homeScore: number; awayScore: number }[] | null;
    winnerTeamId?: string | null;
  }>;
  tournamentId: string;
  format: string;
}) {
  const groupMatches = matches.filter((m) => m.groupName != null);
  const knockoutMatches = matches.filter((m) => m.groupName == null);

  return (
    <Tabs defaultValue="groups" className="space-y-4">
      <TabsList>
        <TabsTrigger value="groups">Vòng bảng</TabsTrigger>
        <TabsTrigger value="knockout">Loại trực tiếp</TabsTrigger>
      </TabsList>
      <TabsContent value="groups">
        <MatchSchedule matches={groupMatches} tournamentId={tournamentId} />
      </TabsContent>
      <TabsContent value="knockout">
        {knockoutMatches.length > 0 ? (
          <BracketView
            matches={knockoutMatches}
            tournamentId={tournamentId}
            variant="single"
          />
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Chưa tạo trận đấu vòng loại trực tiếp.
          </p>
        )}
      </TabsContent>
    </Tabs>
  );
}
