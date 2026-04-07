'use client';

import Link from 'next/link';

import { useAuth } from '@/lib/auth/context';
import { ROUTES } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { OrganizerDashboard } from '@/components/dashboard/organizer-dashboard';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';
import { PlayerDashboard } from '@/components/dashboard/player-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Compass, Trophy, Users as UsersIcon } from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Chào mừng trở lại, {user.fullName}
        </h1>
        <p className="text-muted-foreground">
          Đây là những hoạt động thể thao mới nhất của bạn.
        </p>
      </div>

      {user.role === 'admin' && <AdminDashboard />}
      {user.role === 'organizer' && <OrganizerDashboard />}
      {(user.role === 'player' || user.role === 'team_manager') && (
        <PlayerDashboard />
      )}
      {user.role === 'referee' && <SimpleDashboard role={user.role} />}
    </div>
  );
}

function SimpleDashboard({ role }: { role: string }) {
  const isTeamMgr = role === 'team_manager';

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Link href={ROUTES.publicTournaments} className="block">
        <Card className="h-full transition-shadow hover:shadow-md hover:border-primary/20">
          <CardContent className="flex flex-col items-center text-center p-6 space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Compass className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-sm">Khám phá giải đấu</CardTitle>
            <p className="text-xs text-muted-foreground">
              Tìm và tham gia các giải đấu đang mở đăng ký.
            </p>
          </CardContent>
        </Card>
      </Link>

      <Link href={ROUTES.tournaments} className="block">
        <Card className="h-full transition-shadow hover:shadow-md hover:border-primary/20">
          <CardContent className="flex flex-col items-center text-center p-6 space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-sm">Giải đấu của tôi</CardTitle>
            <p className="text-xs text-muted-foreground">
              {isTeamMgr
                ? 'Xem các giải đấu và đội bạn đang quản lý.'
                : 'Xem các giải đấu bạn đang tham gia.'}
            </p>
          </CardContent>
        </Card>
      </Link>

      <Link href={ROUTES.profile} className="block">
        <Card className="h-full transition-shadow hover:shadow-md hover:border-primary/20">
          <CardContent className="flex flex-col items-center text-center p-6 space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <UsersIcon className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-sm">Hồ sơ cá nhân</CardTitle>
            <p className="text-xs text-muted-foreground">
              Cập nhật thông tin và mật khẩu tài khoản.
            </p>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
