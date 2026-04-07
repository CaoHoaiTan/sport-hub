'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
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
  CreditCard,
} from 'lucide-react';

import { useAuth } from '@/lib/auth/context';
import { ROUTES } from '@/lib/constants';
import { formatVND } from '@/lib/utils/format';
import { GET_PUBLIC_TOURNAMENT } from '@/graphql/queries/public';
import { GET_TEAMS_BY_TOURNAMENT } from '@/graphql/queries/team';
import { GET_PAYMENT_PLANS } from '@/graphql/queries/payment';
import { REGISTER_TEAM_WITH_PLAYERS } from '@/graphql/mutations/team';
import { INITIATE_PAYMENT } from '@/graphql/mutations/payment';
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
    label: 'Bóng đá', jerseyRequired: true, positionLabel: 'Vị trí',
    positions: [
      { value: 'goalkeeper', label: 'Thủ môn' },
      { value: 'defender', label: 'Hậu vệ' },
      { value: 'midfielder', label: 'Tiền vệ' },
      { value: 'forward', label: 'Tiền đạo' },
    ],
  },
  volleyball: {
    label: 'Bóng chuyền', jerseyRequired: true, positionLabel: 'Vị trí',
    positions: [
      { value: 'setter', label: 'Chuyền hai' },
      { value: 'libero', label: 'Libero' },
      { value: 'outside_hitter', label: 'Chủ công' },
      { value: 'middle_blocker', label: 'Phụ công' },
      { value: 'opposite', label: 'Đối chuyền' },
    ],
  },
  badminton: {
    label: 'Cầu lông', jerseyRequired: false, positionLabel: 'Nội dung',
    positions: [
      { value: 'singles', label: 'Đơn' },
      { value: 'doubles', label: 'Đôi' },
    ],
  },
};

interface PlayerDraft { fullName: string; jerseyNumber: string; position: string }
type Step = 'info' | 'players' | 'payment' | 'done';

export default function PublicRegisterPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();

  const [step, setStep] = useState<Step>('info');
  const [teamName, setTeamName] = useState('');
  const [teamLogo, setTeamLogo] = useState('');
  const [teamId, setTeamId] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerDraft[]>([]);
  const [playersInitialized, setPlayersInitialized] = useState(false);

  const { data: tournamentData, loading: loadingTournament } = useQuery(GET_PUBLIC_TOURNAMENT, { variables: { slug }, skip: !slug });
  const tournament = tournamentData?.publicTournament;
  const tournamentId = tournament?.id;
  const sport = tournament?.sport ?? 'football';
  const config = sportConfig[sport] ?? sportConfig.football;
  const minPlayers = tournament?.minPlayersPerTeam ?? 1;
  const maxPlayers = tournament?.maxPlayersPerTeam ?? 25;
  const entryFee = tournament?.entryFee ?? 0;
  const hasFee = entryFee > 0;

  const { data: teamsData, loading: loadingTeams } = useQuery(GET_TEAMS_BY_TOURNAMENT, { variables: { tournamentId }, skip: !tournamentId });
  const { data: plansData } = useQuery(GET_PAYMENT_PLANS, { variables: { tournamentId }, skip: !tournamentId || !hasFee });

  const [registerTeamWithPlayers, { loading: submitting }] = useMutation(REGISTER_TEAM_WITH_PLAYERS, {
    refetchQueries: tournamentId ? [{ query: GET_TEAMS_BY_TOURNAMENT, variables: { tournamentId } }] : [],
  });
  const [initiatePayment, { loading: paying }] = useMutation(INITIATE_PAYMENT);

  const teams = teamsData?.teamsByTournament ?? [];
  const paymentPlans = plansData?.paymentPlansByTournament ?? [];
  const isOpen = tournament?.status === 'registration';
  const isFull = tournament?.maxTeams && teams.length >= tournament.maxTeams;

  const userTeam = useMemo(() => {
    if (!user) return null;
    return teams.find((t: { managerId?: string; manager?: { id: string } }) => t.managerId === user.id || t.manager?.id === user.id) ?? null;
  }, [user, teams]);

  useEffect(() => { if (userTeam) { setStep('done'); setTeamId(userTeam.id); } }, [userTeam]);
  useEffect(() => {
    if (!playersInitialized && minPlayers > 0) {
      setPlayers(Array.from({ length: minPlayers }, () => ({ fullName: '', jerseyNumber: '', position: 'none' })));
      setPlayersInitialized(true);
    }
  }, [minPlayers, playersInitialized]);

  function addRow() { if (players.length < maxPlayers) setPlayers([...players, { fullName: '', jerseyNumber: '', position: 'none' }]); }
  function removeRow(i: number) { if (players.length > minPlayers) setPlayers(players.filter((_, idx) => idx !== i)); }
  function updateP(i: number, field: keyof PlayerDraft, v: string) { setPlayers(players.map((p, idx) => idx === i ? { ...p, [field]: v } : p)); }

  async function handleSubmitTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim() || !tournamentId) return;
    const validPlayers = players.filter((p) => p.fullName.trim());
    if (validPlayers.length < minPlayers) {
      toast.error(`Cần ít nhất ${minPlayers} vận động viên.`);
      return;
    }
    try {
      const r = await registerTeamWithPlayers({
        variables: {
          input: {
            tournamentId,
            name: teamName.trim(),
            logoUrl: teamLogo.trim() || null,
            players: validPlayers.map((p, i) => ({
              fullName: p.fullName.trim(),
              jerseyNumber: p.jerseyNumber ? parseInt(p.jerseyNumber) : i + 1,
              position: p.position !== 'none' ? p.position : null,
            })),
          },
        },
      });
      const newTeamId = r.data?.registerTeamWithPlayers?.id;
      if (newTeamId) {
        setTeamId(newTeamId);
        if (hasFee) {
          setStep('payment');
          toast.success('Đã đăng ký đội! Tiếp tục thanh toán.');
        } else {
          setStep('done');
          toast.success('Đăng ký hoàn tất!');
        }
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Đăng ký thất bại');
    }
  }

  async function handlePay(planId: string) {
    if (!teamId) return;
    try {
      const r = await initiatePayment({ variables: { input: { paymentPlanId: planId, teamId, method: 'bank_transfer' } } });
      if (r.data?.initiatePayment?.paymentUrl) window.open(r.data.initiatePayment.paymentUrl, '_blank');
      toast.success('Thanh toán đã được khởi tạo.'); setStep('done');
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Thất bại'); }
  }

  const validCount = players.filter((p) => p.fullName.trim()).length;

  // ── Guards ──
  if (loadingTournament) return <Wrap><Skeleton className="h-48 w-full" /></Wrap>;
  if (!tournament) return <Wrap><p className="text-center text-muted-foreground py-12">Không tìm thấy giải đấu.</p></Wrap>;
  if (!isOpen) return <Wrap><Card><CardContent className="py-12 text-center"><Users className="h-12 w-12 mx-auto text-muted-foreground/40 mb-2" /><p>Giải đấu hiện không mở đăng ký.</p></CardContent></Card></Wrap>;
  if (!user) {
    const redir = `/t/${slug}/register`;
    return <Wrap><Card><CardContent className="py-12 text-center space-y-4"><LogIn className="h-12 w-12 mx-auto text-muted-foreground/40" /><h3 className="font-semibold">Đăng nhập để đăng ký</h3><div className="flex gap-3 justify-center"><Button asChild><Link href={`${ROUTES.login}?redirect=${encodeURIComponent(redir)}`}>Đăng nhập</Link></Button><Button asChild variant="outline"><Link href={`${ROUTES.register}?redirect=${encodeURIComponent(redir)}`}>Tạo tài khoản</Link></Button></div></CardContent></Card></Wrap>;
  }
  if (step === 'done') return <Wrap><Card className="border-success/30"><CardContent className="py-12 text-center space-y-4"><CheckCircle2 className="h-16 w-16 mx-auto text-success" /><h3 className="font-semibold text-lg">Đăng ký hoàn tất!</h3><p className="text-sm text-muted-foreground">Đội của bạn đã được đăng ký.</p>{teamId && <Button asChild variant="outline"><Link href={ROUTES.teamDetail(teamId)}>Xem đội của tôi</Link></Button>}</CardContent></Card></Wrap>;
  if (isFull) return <Wrap><Card><CardContent className="py-12 text-center"><Users className="h-12 w-12 mx-auto text-muted-foreground/40 mb-2" /><p className="font-semibold">Đã đủ đội</p></CardContent></Card></Wrap>;

  const steps = [
    { key: 'info', label: 'Đội & VĐV' },
    ...(hasFee ? [{ key: 'payment', label: 'Thanh toán' }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Đăng ký tham gia</h1>
          <p className="text-sm text-muted-foreground">
            {tournament.name} — {config.label}
            {hasFee && <span className="ml-2 font-medium text-foreground">(Lệ phí: {formatVND(entryFee)})</span>}
          </p>
        </div>
        <Badge variant="secondary">{teams.length}{tournament.maxTeams ? ` / ${tournament.maxTeams}` : ''} đội</Badge>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-sm">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            {i > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
            <div className={`flex items-center gap-1.5 ${step === s.key ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${step === s.key ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>{i + 1}</span>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">

          {/* Step 1: Team + Players (single form) */}
          {step === 'info' && (
            <form onSubmit={handleSubmitTeam} className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Thông tin đội</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label>Tên đội *</Label><Input placeholder="Nhập tên đội" value={teamName} onChange={(e) => setTeamName(e.target.value)} required /></div>
                  <div className="space-y-2"><Label>Logo URL (tùy chọn)</Label><Input placeholder="https://..." value={teamLogo} onChange={(e) => setTeamLogo(e.target.value)} /></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Vận động viên ({validCount}/{minPlayers} tối thiểu)</CardTitle>
                    {players.length < maxPlayers && <Button type="button" variant="outline" size="sm" onClick={addRow}><Plus className="mr-1 h-3 w-3" />Thêm</Button>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {players.map((p, i) => (
                    <div key={i} className="flex gap-2 items-end">
                      <div className="flex-1 space-y-1">
                        {i === 0 && <Label className="text-xs">Họ tên *</Label>}
                        <Input placeholder={`VĐV ${i + 1}`} value={p.fullName} onChange={(e) => updateP(i, 'fullName', e.target.value)} />
                      </div>
                      {config.jerseyRequired && (
                        <div className="w-20 space-y-1">
                          {i === 0 && <Label className="text-xs">Số áo</Label>}
                          <Input type="number" min={0} max={99} placeholder="#" value={p.jerseyNumber} onChange={(e) => updateP(i, 'jerseyNumber', e.target.value)} />
                        </div>
                      )}
                      <div className="w-32 space-y-1">
                        {i === 0 && <Label className="text-xs">{config.positionLabel}</Label>}
                        <Select value={p.position} onValueChange={(v) => updateP(i, 'position', v)}>
                          <SelectTrigger className="h-9"><SelectValue placeholder="Chọn" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">—</SelectItem>
                            {config.positions.map((pos) => <SelectItem key={pos.value} value={pos.value}>{pos.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      {players.length > minPlayers && (
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive" onClick={() => removeRow(i)}><Trash2 className="h-4 w-4" /></Button>
                      )}
                    </div>
                  ))}
                  {validCount < minPlayers && <p className="text-xs text-destructive text-center">Cần thêm {minPlayers - validCount} VĐV nữa</p>}
                </CardContent>
              </Card>

              <Button type="submit" className="w-full" disabled={submitting || !teamName.trim() || validCount < minPlayers}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {hasFee ? 'Tiếp tục — Thanh toán' : 'Đăng ký đội'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          )}

          {/* Step 3 */}
          {step === 'payment' && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4" />Thanh toán lệ phí</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4 text-center space-y-1">
                  <p className="text-2xl font-bold">{formatVND(entryFee)}</p>
                  <p className="text-sm text-muted-foreground">Lệ phí tham gia</p>
                </div>
                {paymentPlans.length > 0 ? (
                  <div className="space-y-2">
                    {paymentPlans.map((plan: { id: string; name: string; amount: number; earlyBirdAmount?: number | null }) => (
                      <div key={plan.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="text-sm font-medium">{plan.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatVND(plan.amount)}
                            {plan.earlyBirdAmount && <span className="ml-2 text-success">Ưu đãi: {formatVND(plan.earlyBirdAmount)}</span>}
                          </p>
                        </div>
                        <Button size="sm" onClick={() => handlePay(plan.id)} disabled={paying}>
                          {paying && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}Thanh toán
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">Chưa có kế hoạch thanh toán. Liên hệ ban tổ chức.</p>
                )}
                <Separator />
                <Button variant="outline" className="w-full" onClick={() => { setStep('done'); toast.success('Đăng ký hoàn tất! Thanh toán sau.'); }}>
                  Thanh toán sau
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Đội đã đăng ký</h3>
          {loadingTeams ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : teams.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có đội nào.</p>
          ) : (
            <div className="space-y-3">
              {teams.map((t: { id: string; name: string; logoUrl?: string | null; manager?: { id: string; fullName: string } | null; groupName?: string | null; seed?: number | null }) => (
                <TeamCard key={t.id} team={t} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return <div className="max-w-2xl mx-auto">{children}</div>;
}
