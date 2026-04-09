'use client';

import { type ReactNode } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { useQuery } from '@apollo/client';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  QrCode,
  CreditCard,
  MessageSquare,
  Settings,
  Trophy,
} from 'lucide-react';

import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/auth/context';
import { isOrganizer } from '@/lib/utils/roles';
import { ROUTES } from '@/lib/constants';
import { GET_TOURNAMENT } from '@/graphql/queries/tournament';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TournamentStatusBadge } from '@/components/tournament/tournament-status-badge';

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

interface TabDef {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  organizerOnly?: boolean;
  hidden?: boolean;
}

export default function TournamentDetailLayout({
  children,
}: {
  children: ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const { user } = useAuth();
  const id = params.id as string;

  const { data, loading } = useQuery(GET_TOURNAMENT, {
    variables: { id },
    skip: !id,
  });

  const tournament = data?.tournament;
  const canManage = user && isOrganizer(user.role);

  const tabs: TabDef[] = [
    {
      label: 'Tổng quan',
      href: ROUTES.tournamentDetail(id),
      icon: LayoutDashboard,
    },
    { label: 'Đội', href: ROUTES.tournamentTeams(id), icon: Users },
    {
      label: 'Lịch thi đấu',
      href: ROUTES.tournamentSchedule(id),
      icon: Calendar,
    },
    {
      label: 'Bảng xếp hạng',
      href: ROUTES.tournamentStandings(id),
      icon: BarChart3,
      hidden: tournament?.format === 'single_elimination' || tournament?.format === 'double_elimination',
    },
    {
      label: 'Check-in',
      href: ROUTES.tournamentCheckin(id),
      icon: QrCode,
      organizerOnly: true,
    },
    {
      label: 'Thanh toán',
      href: ROUTES.tournamentPayments(id),
      icon: CreditCard,
      organizerOnly: true,
    },
    {
      label: 'Bài viết',
      href: ROUTES.tournamentPosts(id),
      icon: MessageSquare,
    },
    {
      label: 'Cài đặt',
      href: ROUTES.tournamentSettings(id),
      icon: Settings,
      organizerOnly: true,
    },
  ];

  const visibleTabs = tabs.filter(
    (tab) => !tab.hidden && (!tab.organizerOnly || canManage)
  );

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      ) : tournament ? (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Trophy className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold tracking-tight">
                  {tournament.name}
                </h1>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {sportLabels[tournament.sport] ?? tournament.sport}
            </Badge>
            <Badge variant="secondary">
              {formatLabels[tournament.format] ?? tournament.format}
            </Badge>
            <TournamentStatusBadge status={tournament.status} />
          </div>
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-12">
          Không tìm thấy giải đấu.
        </div>
      )}

      <nav className="flex overflow-x-auto border-b" aria-label="Tournament tabs">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            pathname === tab.href ||
            (tab.href !== ROUTES.tournamentDetail(id) &&
              pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div>{children}</div>
    </div>
  );
}
