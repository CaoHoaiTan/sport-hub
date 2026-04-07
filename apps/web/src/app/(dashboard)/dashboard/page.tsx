'use client';

import { useAuth } from '@/lib/auth/context';
import { Skeleton } from '@/components/ui/skeleton';
import { OrganizerDashboard } from '@/components/dashboard/organizer-dashboard';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';
import { PlayerDashboard } from '@/components/dashboard/player-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';

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
      {user.role === 'player' && <PlayerDashboard />}
      {(user.role === 'team_manager' || user.role === 'referee') && (
        <SimpleDashboard role={user.role} />
      )}
    </div>
  );
}

function SimpleDashboard({ role }: { role: string }) {
  const roleLabel = role === 'team_manager' ? 'Quản lý đội' : 'Trọng tài';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          {roleLabel} Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Xem các giải đấu và trận đấu sắp tới từ thanh điều hướng bên.
        </p>
      </CardContent>
    </Card>
  );
}
