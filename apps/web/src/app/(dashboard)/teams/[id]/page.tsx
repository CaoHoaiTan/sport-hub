'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client';
import Link from 'next/link';
import {
  Users,
  Shield,
  Hash,
  Lock,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

import { useAuth } from '@/lib/auth/context';
import { isOrganizer } from '@/lib/utils/roles';
import { formatVND } from '@/lib/utils/format';
import { ROUTES } from '@/lib/constants';
import { GET_TEAM } from '@/graphql/queries/team';
import { GET_PAYMENTS_BY_TEAM } from '@/graphql/queries/payment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

const positionLabels: Record<string, string> = {
  goalkeeper: 'Thủ môn', defender: 'Hậu vệ', midfielder: 'Tiền vệ', forward: 'Tiền đạo',
  setter: 'Chuyền hai', libero: 'Libero', outside_hitter: 'Chủ công', middle_blocker: 'Phụ công', opposite: 'Đối chuyền',
  singles: 'Đơn', doubles: 'Đôi',
};

export default function TeamDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const id = params.id as string;

  const { data, loading } = useQuery(GET_TEAM, { variables: { id }, skip: !id });
  const { data: paymentsData } = useQuery(GET_PAYMENTS_BY_TEAM, { variables: { teamId: id }, skip: !id || !user });

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  const team = data?.team;
  if (!team) {
    return <div className="text-center text-muted-foreground py-12">Không tìm thấy đội.</div>;
  }

  const players = team.players ?? [];
  const isMyTeam = user && team.managerId === user.id;
  const canEdit = user && (isMyTeam || isOrganizer(user.role));
  const tournament = team.tournament;
  const entryFee = tournament?.entryFee ?? 0;
  const hasFee = entryFee > 0;

  // Payment status
  const payments = paymentsData?.paymentsByTeam ?? [];
  const hasPaid = payments.some((p: { status: string }) => p.status === 'paid');
  const hasPending = payments.some((p: { status: string }) => p.status === 'pending');
  const needsPayment = hasFee && !hasPaid;

  return (
    <div className="space-y-6">
      {/* Payment warning for team owner */}
      {isMyTeam && needsPayment && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="flex items-center gap-4 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800">Chưa thanh toán lệ phí</p>
              <p className="text-xs text-amber-600">
                Lệ phí tham gia: {formatVND(entryFee)}.
                {hasPending ? ' Thanh toán đang chờ xử lý.' : ' Vui lòng thanh toán để hoàn tất đăng ký.'}
              </p>
            </div>
            {tournament?.id && (
              <Button asChild size="sm" variant="outline">
                <Link href={ROUTES.tournamentPayments(tournament.id)}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Thanh toán
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment confirmed badge */}
      {isMyTeam && hasPaid && hasFee && (
        <Card className="border-success/30 bg-success/5">
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            <p className="text-sm font-medium text-success">Đã thanh toán lệ phí</p>
          </CardContent>
        </Card>
      )}

      {/* Team header */}
      <Card className={isMyTeam ? 'border-primary/30 bg-primary/5' : ''}>
        <CardContent className="flex items-center gap-4 p-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={team.logoUrl ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
              {team.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{team.name}</h1>
              {isMyTeam && <Badge variant="default" className="text-[10px]">Đội của tôi</Badge>}
              {needsPayment && <Badge variant="warning" className="text-[10px]">Chưa thanh toán</Badge>}
              {hasPaid && hasFee && <Badge variant="success" className="text-[10px]">Đã thanh toán</Badge>}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              {team.manager && (
                <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" />{team.manager.fullName}</span>
              )}
              {team.groupName && <Badge variant="outline" className="text-[10px]">Bảng {team.groupName}</Badge>}
              {team.seed && <span className="flex items-center gap-1 text-xs"><Hash className="h-3 w-3" />Hạt giống {team.seed}</span>}
            </div>
          </div>
          {canEdit ? (
            <Button asChild variant="outline">
              <Link href={ROUTES.teamPlayers(id)}><Users className="mr-2 h-4 w-4" />Quản lý VĐV</Link>
            </Button>
          ) : (
            <div className="flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" />Chỉ xem</div>
          )}
        </CardContent>
      </Card>

      {/* Roster */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />Đội hình ({players.length} VĐV)</CardTitle>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Chưa có vận động viên nào.</p>
          ) : (
            <div className="space-y-2">
              {players.map((player: { id: string; fullName: string; jerseyNumber: number | null; position: string | null; isCaptain: boolean; isActive: boolean }) => (
                <div key={player.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <div className="flex items-center gap-3">
                    {player.jerseyNumber != null && (
                      <span className="text-xs font-mono font-bold text-muted-foreground w-6 text-right">#{player.jerseyNumber}</span>
                    )}
                    <span className="text-sm font-medium">{player.fullName}</span>
                    {player.isCaptain && <Badge variant="secondary" className="text-[10px]">Đội trưởng</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    {player.position && <span className="text-xs text-muted-foreground">{positionLabels[player.position] ?? player.position}</span>}
                    <Badge variant={player.isActive ? 'success' : 'secondary'} className="text-[10px]">
                      {player.isActive ? 'Hoạt động' : 'Ngưng'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
