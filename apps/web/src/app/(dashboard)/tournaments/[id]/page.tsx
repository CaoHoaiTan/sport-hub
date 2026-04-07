'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import {
  Calendar,
  Users,
  DollarSign,
  FileText,
  AlertTriangle,
  PlayCircle,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  Info,
} from 'lucide-react';

import { useAuth } from '@/lib/auth/context';
import { isOrganizer } from '@/lib/utils/roles';
import { ROUTES } from '@/lib/constants';
import { formatDate, formatVND } from '@/lib/utils/format';
import { GET_TOURNAMENT } from '@/graphql/queries/tournament';
import { UPDATE_TOURNAMENT_STATUS } from '@/graphql/mutations/tournament';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { TournamentStatusBadge } from '@/components/tournament/tournament-status-badge';

const formatLabels: Record<string, string> = {
  round_robin: 'Round Robin',
  single_elimination: 'Single Elimination',
  double_elimination: 'Double Elimination',
  group_stage_knockout: 'Group Stage + Knockout',
};

export default function TournamentOverviewPage() {
  const params = useParams();
  const { user } = useAuth();
  const id = params.id as string;

  const { data, loading } = useQuery(GET_TOURNAMENT, {
    variables: { id },
    skip: !id,
  });

  const [updateStatus, { loading: updating }] = useMutation(
    UPDATE_TOURNAMENT_STATUS,
    {
      refetchQueries: [{ query: GET_TOURNAMENT, variables: { id } }],
    }
  );

  const tournament = data?.tournament;
  const canManage = user && isOrganizer(user.role);

  async function handleStatusChange(newStatus: string) {
    try {
      await updateStatus({
        variables: { id, status: newStatus },
      });
      toast.success(`Tournament status updated to ${newStatus}.`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to update status';
      toast.error(message);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Tournament data not available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chi tiết giải đấu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tournament.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Mô tả
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {tournament.description}
                  </p>
                </div>
              )}

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoItem
                  icon={Calendar}
                  label="Ngày bắt đầu"
                  value={
                    tournament.startDate
                      ? formatDate(tournament.startDate)
                      : 'Chưa xác định'
                  }
                />
                <InfoItem
                  icon={Calendar}
                  label="Ngày kết thúc"
                  value={
                    tournament.endDate
                      ? formatDate(tournament.endDate)
                      : 'Chưa xác định'
                  }
                />
                <InfoItem
                  icon={Users}
                  label="Cầu thủ mỗi đội"
                  value={`${tournament.minPlayersPerTeam} - ${tournament.maxPlayersPerTeam}`}
                />
                <InfoItem
                  icon={Users}
                  label="Số đội tối đa"
                  value={tournament.maxTeams ? String(tournament.maxTeams) : 'Không giới hạn'}
                />
                <InfoItem
                  icon={DollarSign}
                  label="Lệ phí"
                  value={
                    tournament.entryFee > 0
                      ? formatVND(tournament.entryFee)
                      : 'Miễn phí'
                  }
                />
                <InfoItem
                  icon={FileText}
                  label="Thể thức"
                  value={
                    formatLabels[tournament.format] ?? tournament.format
                  }
                />
              </div>

              {tournament.registrationStart && (
                <>
                  <Separator />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoItem
                      icon={Calendar}
                      label="Mở đăng ký"
                      value={formatDate(tournament.registrationStart)}
                    />
                    <InfoItem
                      icon={Calendar}
                      label="Đóng đăng ký"
                      value={
                        tournament.registrationEnd
                          ? formatDate(tournament.registrationEnd)
                          : 'Chưa xác định'
                      }
                    />
                  </div>
                </>
              )}

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Hệ thống điểm
                </p>
                <div className="flex gap-4">
                  <Badge variant="success">W: {tournament.pointsForWin}</Badge>
                  <Badge variant="warning">D: {tournament.pointsForDraw}</Badge>
                  <Badge variant="secondary">L: {tournament.pointsForLoss}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {canManage && (
          <div className="space-y-6">
            {/* Status Management */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quản lý trạng thái</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Hiện tại:
                  </span>
                  <TournamentStatusBadge status={tournament.status} />
                </div>

                <Separator />

                <div className="space-y-2">
                  {tournament.status === 'draft' && (
                    <Button
                      className="w-full"
                      onClick={() => handleStatusChange('registration')}
                      disabled={updating}
                    >
                      {updating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <PlayCircle className="mr-2 h-4 w-4" />
                      )}
                      Mở đăng ký
                    </Button>
                  )}

                  {tournament.status === 'registration' && (
                    <Button
                      className="w-full"
                      onClick={() => handleStatusChange('in_progress')}
                      disabled={updating}
                    >
                      {updating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <PlayCircle className="mr-2 h-4 w-4" />
                      )}
                      Bắt đầu giải đấu
                    </Button>
                  )}

                  {tournament.status === 'in_progress' && (
                    <Button
                      className="w-full"
                      onClick={() => handleStatusChange('completed')}
                      disabled={updating}
                    >
                      {updating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Hoàn thành giải đấu
                    </Button>
                  )}

                  {tournament.status !== 'cancelled' &&
                    tournament.status !== 'completed' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="destructive"
                            className="w-full"
                            disabled={updating}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Hủy giải đấu
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-destructive" />
                              Hủy giải đấu
                            </DialogTitle>
                            <DialogDescription>
                              Bạn có chắc muốn hủy giải đấu này? Hành động này
                              không thể hoàn tác. Tất cả đội đã đăng ký và trận
                              đấu đã lên lịch sẽ bị ảnh hưởng.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Giữ lại</Button>
                            </DialogClose>
                            <Button
                              variant="destructive"
                              onClick={() => handleStatusChange('cancelled')}
                              disabled={updating}
                            >
                              {updating && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Xác nhận hủy
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                </div>
              </CardContent>
            </Card>

            {/* Next Steps Guidance */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Bước tiếp theo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tournament.status === 'draft' && (
                  <>
                    <StepItem
                      done={!!tournament.startDate}
                      label="Cài đặt ngày giờ"
                      href={ROUTES.tournamentSettings(id)}
                    />
                    <StepItem
                      done={!!tournament.registrationStart}
                      label="Cài đặt thời gian đăng ký"
                      href={ROUTES.tournamentSettings(id)}
                    />
                    <Separator />
                    <p className="text-xs text-muted-foreground">
                      Khi đã sẵn sàng, nhấn &quot;Mở đăng ký&quot; để cho phép
                      các đội đăng ký tham gia.
                    </p>
                  </>
                )}

                {tournament.status === 'registration' && (
                  <>
                    <StepItem
                      done={false}
                      label="Chờ các đội đăng ký"
                      href={ROUTES.tournamentTeams(id)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Chia sẻ link công khai để các đội đăng ký. Khi đủ đội,
                      nhấn &quot;Bắt đầu giải đấu&quot;.
                    </p>
                    {tournament.slug && (
                      <div className="rounded-md bg-muted p-2 text-xs break-all">
                        {typeof window !== 'undefined' ? window.location.origin : ''}/t/{tournament.slug}
                      </div>
                    )}
                  </>
                )}

                {tournament.status === 'in_progress' && (
                  <>
                    <StepItem
                      done={false}
                      label="Tạo lịch thi đấu"
                      href={ROUTES.tournamentSchedule(id)}
                    />
                    <StepItem
                      done={false}
                      label="Mở check-in cho trận đấu"
                      href={ROUTES.tournamentCheckin(id)}
                    />
                    <StepItem
                      done={false}
                      label="Nhập kết quả trận đấu"
                      href={ROUTES.tournamentSchedule(id)}
                    />
                    <StepItem
                      done={false}
                      label="Xem bảng xếp hạng"
                      href={ROUTES.tournamentStandings(id)}
                    />
                    <Separator />
                    <p className="text-xs text-muted-foreground">
                      Khi tất cả trận đấu hoàn thành, nhấn &quot;Hoàn thành
                      giải đấu&quot;.
                    </p>
                  </>
                )}

                {tournament.status === 'completed' && (
                  <p className="text-sm text-muted-foreground">
                    Giải đấu đã hoàn thành. Xem kết quả tại tab Bảng xếp hạng.
                  </p>
                )}

                {tournament.status === 'cancelled' && (
                  <p className="text-sm text-muted-foreground">
                    Giải đấu đã bị hủy.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function StepItem({
  done,
  label,
  href,
}: {
  done: boolean;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-md p-2 text-sm transition-colors hover:bg-accent"
    >
      {done ? (
        <CheckCircle className="h-4 w-4 text-success shrink-0" />
      ) : (
        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
      )}
      <span className={done ? 'text-muted-foreground line-through' : ''}>
        {label}
      </span>
      <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground" />
    </Link>
  );
}
