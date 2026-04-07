import { type Metadata } from 'next';
import {
  Calendar,
  Users,
  DollarSign,
  FileText,
  Trophy,
  MapPin,
  Clock,
} from 'lucide-react';

import Link from 'next/link';

import { getClient } from '@/lib/apollo/rsc-client';
import { GET_PUBLIC_TOURNAMENT } from '@/graphql/queries/public';
import { formatDate, formatVND } from '@/lib/utils/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TournamentStatusBadge } from '@/components/tournament/tournament-status-badge';

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface TournamentData {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sport: string;
  format: string;
  status: 'draft' | 'registration' | 'in_progress' | 'completed' | 'cancelled';
  maxTeams?: number | null;
  minPlayersPerTeam: number;
  maxPlayersPerTeam: number;
  registrationStart?: string | null;
  registrationEnd?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  pointsForWin: number;
  pointsForDraw: number;
  pointsForLoss: number;
  entryFee: number;
  bannerUrl?: string | null;
  rulesText?: string | null;
  createdAt: string;
  organizer?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  } | null;
}

const sportLabels: Record<string, string> = {
  football: 'Bóng đá',
  volleyball: 'Bóng chuyền',
  badminton: 'Cầu lông',
};

const formatLabels: Record<string, string> = {
  round_robin: 'Vòng tròn',
  single_elimination: 'Loại trực tiếp',
  double_elimination: 'Loại trực tiếp (kép)',
  group_stage_knockout: 'Vòng bảng + Loại trực tiếp',
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const client = getClient();

  try {
    const { data } = await client.query({
      query: GET_PUBLIC_TOURNAMENT,
      variables: { slug },
    });

    const tournament = data?.publicTournament;
    return {
      title: tournament ? tournament.name : 'Giải đấu',
      description: tournament?.description ?? 'Chi tiết giải đấu thể thao',
    };
  } catch {
    return {
      title: 'Giải đấu',
      description: 'Chi tiết giải đấu thể thao',
    };
  }
}

export default async function PublicTournamentOverviewPage({ params }: PageProps) {
  const { slug } = await params;
  const client = getClient();

  let tournament: TournamentData | null = null;

  try {
    const { data } = await client.query({
      query: GET_PUBLIC_TOURNAMENT,
      variables: { slug },
    });
    tournament = data?.publicTournament ?? null;
  } catch {
    // Render empty state below
  }

  if (!tournament) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Không tìm thấy giải đấu.
      </div>
    );
  }

  const organizer = tournament.organizer;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {tournament.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mô tả</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">
                  {tournament.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Tournament Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin giải đấu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {sportLabels[tournament.sport] ?? tournament.sport}
                </Badge>
                <Badge variant="secondary">
                  {formatLabels[tournament.format] ?? tournament.format}
                </Badge>
                <TournamentStatusBadge status={tournament.status} />
              </div>

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
                  label="Số đội tối đa"
                  value={
                    tournament.maxTeams
                      ? String(tournament.maxTeams)
                      : 'Không giới hạn'
                  }
                />
                <InfoItem
                  icon={Users}
                  label="Số cầu thủ mỗi đội"
                  value={`${tournament.minPlayersPerTeam} - ${tournament.maxPlayersPerTeam}`}
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

              {/* Registration period */}
              {tournament.registrationStart && (
                <>
                  <Separator />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoItem
                      icon={Clock}
                      label="Mở đăng ký"
                      value={formatDate(tournament.registrationStart)}
                    />
                    <InfoItem
                      icon={Clock}
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

              {/* Points system */}
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Hệ thống điểm
                </p>
                <div className="flex gap-4">
                  <Badge variant="default">
                    Thắng: {tournament.pointsForWin}
                  </Badge>
                  <Badge variant="secondary">
                    Hòa: {tournament.pointsForDraw}
                  </Badge>
                  <Badge variant="outline">
                    Thua: {tournament.pointsForLoss}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rules */}
          {tournament.rulesText && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Điều lệ</CardTitle>
              </CardHeader>
              <CardContent>
                <RulesDisplay rulesText={tournament.rulesText} sport={tournament.sport} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Registration CTA */}
          {tournament.status === 'registration' && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-6 space-y-3">
                <h3 className="font-semibold text-sm">
                  Đang mở đăng ký
                </h3>
                <p className="text-xs text-muted-foreground">
                  Đăng nhập để đăng ký đội tham gia giải đấu này.
                </p>
                <Button asChild className="w-full" size="sm">
                  <Link href={`/t/${tournament.slug}/register`}>
                    Đăng ký tham gia
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Organizer */}
          {organizer && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ban tổ chức</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={organizer.avatarUrl ?? undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {organizer.fullName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{organizer.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      Người tổ chức
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tổng quan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Môn
                </span>
                <span className="text-sm font-medium capitalize">
                  {sportLabels[tournament.sport] ?? tournament.sport}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Đội tối đa
                </span>
                <span className="text-sm font-medium">
                  {tournament.maxTeams
                    ? String(tournament.maxTeams)
                    : 'Không giới hạn'}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Lệ phí
                </span>
                <span className="text-sm font-medium">
                  {tournament.entryFee > 0
                    ? formatVND(tournament.entryFee)
                    : 'Miễn phí'}
                </span>
              </div>
              {tournament.createdAt && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Ngày tạo
                    </span>
                    <span className="text-sm font-medium">
                      {formatDate(tournament.createdAt)}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
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

const categoryLabels: Record<string, string> = {
  singles_men: 'Đơn nam',
  singles_women: 'Đơn nữ',
  doubles_men: 'Đôi nam',
  doubles_women: 'Đôi nữ',
  mixed_doubles: 'Đôi nam nữ (Mixed)',
  men: 'Nam',
  women: 'Nữ',
  mixed: 'Nam nữ (Mixed)',
  beach_men: 'Bãi biển nam',
  beach_women: 'Bãi biển nữ',
  beach_mixed: 'Bãi biển nam nữ',
};

function RulesDisplay({ rulesText, sport }: { rulesText: string; sport: string }) {
  let rules: Record<string, unknown>;
  try {
    rules = JSON.parse(rulesText);
  } catch {
    // Not JSON — show as plain text
    return <p className="text-sm whitespace-pre-wrap">{rulesText}</p>;
  }

  const items: { label: string; value: string }[] = [];

  if (sport === 'football') {
    if (rules.matchDuration) items.push({ label: 'Thời gian thi đấu', value: `${rules.matchDuration} phút` });
    if (rules.halfCount) items.push({ label: 'Số hiệp', value: String(rules.halfCount) });
    if (rules.hasExtraTime) items.push({ label: 'Hiệp phụ', value: 'Có' });
    if (rules.hasPenalty) items.push({ label: 'Đá luân lưu', value: 'Có' });
  }

  if (sport === 'volleyball') {
    if (rules.volleyballCategory) items.push({ label: 'Hạng mục', value: categoryLabels[rules.volleyballCategory as string] ?? String(rules.volleyballCategory) });
    if (rules.setsToWin) items.push({ label: 'Số set thắng', value: String(rules.setsToWin) });
    if (rules.pointsPerSet) items.push({ label: 'Điểm mỗi set', value: String(rules.pointsPerSet) });
    if (rules.finalSetPoints) items.push({ label: 'Điểm set cuối', value: String(rules.finalSetPoints) });
  }

  if (sport === 'badminton') {
    if (rules.badmintonCategory) items.push({ label: 'Hạng mục', value: categoryLabels[rules.badmintonCategory as string] ?? String(rules.badmintonCategory) });
    if (rules.setsToWin) items.push({ label: 'Số set thắng', value: String(rules.setsToWin) });
    if (rules.pointsPerSet) items.push({ label: 'Điểm mỗi set', value: String(rules.pointsPerSet) });
    if (rules.maxPoints) items.push({ label: 'Điểm tối đa', value: String(rules.maxPoints) });
  }

  if (items.length === 0) {
    return <p className="text-sm whitespace-pre-wrap">{rulesText}</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label}>
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className="text-sm font-medium">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
