'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Users,
  Loader2,
  LogIn,
  CheckCircle2,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

import { useAuth } from '@/lib/auth/context';
import { ROUTES } from '@/lib/constants';
import { GET_PUBLIC_TOURNAMENT } from '@/graphql/queries/public';
import { GET_TEAMS_BY_TOURNAMENT } from '@/graphql/queries/team';
import { REGISTER_TEAM } from '@/graphql/mutations/team';
import { ADD_PLAYER } from '@/graphql/mutations/player';
import { TeamCard } from '@/components/team/team-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const sportConfig: Record<string, {
  label: string;
  jerseyRequired: boolean;
  positionLabel: string;
  positions: { value: string; label: string }[];
}> = {
  football: {
    label: 'Bóng đá',
    jerseyRequired: true,
    positionLabel: 'Vị trí',
    positions: [
      { value: 'goalkeeper', label: 'Thủ môn' },
      { value: 'defender', label: 'Hậu vệ' },
      { value: 'midfielder', label: 'Tiền vệ' },
      { value: 'forward', label: 'Tiền đạo' },
    ],
  },
  volleyball: {
    label: 'Bóng chuyền',
    jerseyRequired: true,
    positionLabel: 'Vị trí',
    positions: [
      { value: 'setter', label: 'Chuyền hai' },
      { value: 'libero', label: 'Libero' },
      { value: 'outside_hitter', label: 'Chủ công' },
      { value: 'middle_blocker', label: 'Phụ công' },
      { value: 'opposite', label: 'Đối chuyền' },
    ],
  },
  badminton: {
    label: 'Cầu lông',
    jerseyRequired: false,
    positionLabel: 'Nội dung',
    positions: [
      { value: 'singles', label: 'Đơn' },
      { value: 'doubles', label: 'Đôi' },
    ],
  },
};

interface PlayerDraft {
  fullName: string;
  jerseyNumber: string;
  position: string;
}

export default function PublicRegisterPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();

  // Step: 'info' | 'players' | 'done'
  const [step, setStep] = useState<'info' | 'players' | 'done'>('info');
  const [teamName, setTeamName] = useState('');
  const [teamLogo, setTeamLogo] = useState('');
  const [teamId, setTeamId] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerDraft[]>([]);

  const { data: tournamentData, loading: loadingTournament } = useQuery(
    GET_PUBLIC_TOURNAMENT,
    { variables: { slug }, skip: !slug }
  );

  const tournament = tournamentData?.publicTournament;
  const tournamentId = tournament?.id;
  const sport = tournament?.sport ?? 'football';
  const config = sportConfig[sport] ?? sportConfig.football;
  const minPlayers = tournament?.minPlayersPerTeam ?? 1;
  const maxPlayers = tournament?.maxPlayersPerTeam ?? 25;

  const { data: teamsData, loading: loadingTeams } = useQuery(
    GET_TEAMS_BY_TOURNAMENT,
    { variables: { tournamentId }, skip: !tournamentId }
  );

  const [registerTeam, { loading: registering }] = useMutation(REGISTER_TEAM, {
    refetchQueries: tournamentId
      ? [{ query: GET_TEAMS_BY_TOURNAMENT, variables: { tournamentId } }]
      : [],
  });

  const [addPlayer, { loading: addingPlayer }] = useMutation(ADD_PLAYER);

  const teams = teamsData?.teamsByTournament ?? [];
  const isRegistrationOpen = tournament?.status === 'registration';
  const isFull = tournament?.maxTeams && teams.length >= tournament.maxTeams;

  // Check if user already has a team
  const userTeam = useMemo(() => {
    if (!user) return null;
    return teams.find(
      (t: { managerId?: string; manager?: { id: string } }) =>
        t.managerId === user.id || t.manager?.id === user.id
    ) ?? null;
  }, [user, teams]);

  useEffect(() => {
    if (userTeam) {
      setStep('done');
      setTeamId(userTeam.id);
    }
  }, [userTeam]);

  // Initialize players array with min slots
  useEffect(() => {
    if (step === 'players' && players.length === 0) {
      setPlayers(
        Array.from({ length: minPlayers }, () => ({
          fullName: '',
          jerseyNumber: '',
          position: 'none',
        }))
      );
    }
  }, [step, minPlayers, players.length]);

  function addPlayerRow() {
    if (players.length >= maxPlayers) return;
    setPlayers([...players, { fullName: '', jerseyNumber: '', position: 'none' }]);
  }

  function removePlayerRow(index: number) {
    if (players.length <= minPlayers) return;
    setPlayers(players.filter((_, i) => i !== index));
  }

  function updatePlayer(index: number, field: keyof PlayerDraft, value: string) {
    setPlayers(players.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }

  async function handleRegisterTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim() || !tournamentId) return;
    try {
      const result = await registerTeam({
        variables: {
          input: {
            tournamentId,
            name: teamName.trim(),
            logoUrl: teamLogo.trim() || null,
          },
        },
      });
      const newTeamId = result.data?.registerTeam?.id;
      if (newTeamId) {
        setTeamId(newTeamId);
        setStep('players');
        toast.success('Đã tạo đội! Tiếp tục thêm vận động viên.');
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Đăng ký thất bại';
      toast.error(msg);
    }
  }

  async function handleSubmitPlayers() {
    if (!teamId) return;
    const validPlayers = players.filter((p) => p.fullName.trim());
    if (validPlayers.length < minPlayers) {
      toast.error(`Cần ít nhất ${minPlayers} vận động viên.`);
      return;
    }

    try {
      for (let i = 0; i < validPlayers.length; i++) {
        const p = validPlayers[i];
        await addPlayer({
          variables: {
            input: {
              teamId,
              fullName: p.fullName.trim(),
              jerseyNumber: p.jerseyNumber ? parseInt(p.jerseyNumber) : i + 1,
              position: p.position && p.position !== 'none' ? p.position : null,
            },
          },
        });
      }
      toast.success('Đăng ký đội hoàn tất!');
      setStep('done');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Thêm VĐV thất bại';
      toast.error(msg);
    }
  }

  const validCount = players.filter((p) => p.fullName.trim()).length;

  // ── Loading ──
  if (loadingTournament) {
    return <PageWrapper><Skeleton className="h-48 w-full" /></PageWrapper>;
  }

  if (!tournament) {
    return <PageWrapper><p className="text-center text-muted-foreground py-12">Không tìm thấy giải đấu.</p></PageWrapper>;
  }

  if (!isRegistrationOpen) {
    return (
      <PageWrapper>
        <Card><CardContent className="py-12 text-center space-y-2">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <p>Giải đấu hiện không mở đăng ký.</p>
        </CardContent></Card>
      </PageWrapper>
    );
  }

  // ── Not logged in ──
  if (!user) {
    const redirectUrl = `/t/${slug}/register`;
    return (
      <PageWrapper>
        <Card><CardContent className="py-12 text-center space-y-4">
          <LogIn className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <h3 className="font-semibold">Đăng nhập để đăng ký</h3>
          <p className="text-sm text-muted-foreground">Bạn cần có tài khoản để đăng ký đội.</p>
          <div className="flex gap-3 justify-center">
            <Button asChild><Link href={`${ROUTES.login}?redirect=${encodeURIComponent(redirectUrl)}`}>Đăng nhập</Link></Button>
            <Button asChild variant="outline"><Link href={`${ROUTES.register}?redirect=${encodeURIComponent(redirectUrl)}`}>Tạo tài khoản</Link></Button>
          </div>
        </CardContent></Card>
      </PageWrapper>
    );
  }

  // ── Done ──
  if (step === 'done') {
    return (
      <PageWrapper>
        <Card className="border-success/30">
          <CardContent className="py-12 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 mx-auto text-success" />
            <h3 className="font-semibold text-lg">Đăng ký hoàn tất!</h3>
            <p className="text-sm text-muted-foreground">
              Đội của bạn đã được đăng ký tham gia giải đấu.
            </p>
            {teamId && (
              <Button asChild variant="outline">
                <Link href={ROUTES.teamDetail(teamId)}>Xem đội của tôi</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  // ── Full ──
  if (isFull) {
    return (
      <PageWrapper>
        <Card><CardContent className="py-12 text-center space-y-2">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <h3 className="font-semibold">Giải đấu đã đủ đội</h3>
          <p className="text-sm text-muted-foreground">Đã đạt {tournament.maxTeams} đội tối đa.</p>
        </CardContent></Card>
      </PageWrapper>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Đăng ký tham gia</h1>
          <p className="text-sm text-muted-foreground">
            {tournament.name} — {config.label}
          </p>
        </div>
        <Badge variant="secondary">
          {teams.length}{tournament.maxTeams ? ` / ${tournament.maxTeams}` : ''} đội
        </Badge>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div className={`flex items-center gap-1.5 ${step === 'info' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${step === 'info' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>1</span>
          Thông tin đội
        </div>
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
        <div className={`flex items-center gap-1.5 ${step === 'players' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${step === 'players' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>2</span>
          Thêm VĐV ({minPlayers}-{maxPlayers})
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Step 1: Team info */}
          {step === 'info' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Thông tin đội</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegisterTeam} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tên đội *</Label>
                    <Input
                      placeholder="Nhập tên đội"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Logo URL (tùy chọn)</Label>
                    <Input
                      placeholder="https://example.com/logo.png"
                      value={teamLogo}
                      onChange={(e) => setTeamLogo(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={registering || !teamName.trim()}>
                    {registering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Tiếp tục — Thêm VĐV
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Add players */}
          {step === 'players' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Thêm vận động viên ({validCount}/{minPlayers} tối thiểu)
                  </CardTitle>
                  {players.length < maxPlayers && (
                    <Button variant="outline" size="sm" onClick={addPlayerRow}>
                      <Plus className="mr-1 h-3 w-3" />
                      Thêm
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {players.map((p, i) => (
                  <div key={i} className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      {i === 0 && <Label className="text-xs">Họ tên *</Label>}
                      <Input
                        placeholder={`VĐV ${i + 1}`}
                        value={p.fullName}
                        onChange={(e) => updatePlayer(i, 'fullName', e.target.value)}
                        required
                      />
                    </div>
                    {config.jerseyRequired && (
                      <div className="w-20 space-y-1">
                        {i === 0 && <Label className="text-xs">Số áo</Label>}
                        <Input
                          type="number"
                          min={0}
                          max={99}
                          placeholder="#"
                          value={p.jerseyNumber}
                          onChange={(e) => updatePlayer(i, 'jerseyNumber', e.target.value)}
                        />
                      </div>
                    )}
                    <div className="w-32 space-y-1">
                      {i === 0 && <Label className="text-xs">{config.positionLabel}</Label>}
                      <Select value={p.position} onValueChange={(v) => updatePlayer(i, 'position', v)}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Chọn" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          {config.positions.map((pos) => (
                            <SelectItem key={pos.value} value={pos.value}>{pos.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {players.length > minPlayers && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-destructive"
                        onClick={() => removePlayerRow(i)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                <Separator />

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep('info')}
                    disabled={addingPlayer}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Quay lại
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={validCount < minPlayers || addingPlayer}
                    onClick={handleSubmitPlayers}
                  >
                    {addingPlayer && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Hoàn tất đăng ký ({validCount} VĐV)
                  </Button>
                </div>

                {validCount < minPlayers && (
                  <p className="text-xs text-destructive text-center">
                    Cần thêm ít nhất {minPlayers - validCount} VĐV nữa
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar: registered teams */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Đội đã đăng ký</h3>
          {loadingTeams ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : teams.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có đội nào.</p>
          ) : (
            <div className="space-y-3">
              {teams.map((team: {
                id: string;
                name: string;
                logoUrl?: string | null;
                manager?: { id: string; fullName: string } | null;
                groupName?: string | null;
                seed?: number | null;
              }) => (
                <TeamCard key={team.id} team={team} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return <div className="max-w-2xl mx-auto">{children}</div>;
}
