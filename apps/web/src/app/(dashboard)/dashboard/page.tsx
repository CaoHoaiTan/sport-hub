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
          Welcome back, {user.fullName}
        </h1>
        <p className="text-muted-foreground">
          Here is what is happening with your sports activities.
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
  const roleLabel = role === 'team_manager' ? 'Team Manager' : 'Referee';

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
          View your upcoming tournaments and matches from the sidebar navigation.
        </p>
      </CardContent>
    </Card>
  );
}
