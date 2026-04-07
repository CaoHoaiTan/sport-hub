'use client';

import { useQuery } from '@apollo/client';
import { Users, Trophy, Swords, Clock } from 'lucide-react';

import { formatRelativeTime } from '@/lib/utils/format';
import { GET_ADMIN_DASHBOARD } from '@/graphql/queries/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatCard } from './stat-card';

export function AdminDashboard() {
  const { data, loading } = useQuery(GET_ADMIN_DASHBOARD);

  if (loading) {
    return <AdminDashboardSkeleton />;
  }

  const dashboard = data?.adminDashboard;

  if (!dashboard) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Không thể tải dữ liệu tổng quan.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Tổng người dùng"
          value={dashboard.totalUsers}
          icon={Users}
        />
        <StatCard
          title="Tổng giải đấu"
          value={dashboard.totalTournaments}
          icon={Trophy}
        />
        <StatCard
          title="Tổng trận đấu"
          value={dashboard.totalMatches}
          icon={Swords}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Người dùng gần đây
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dashboard.recentUsers?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ngày tham gia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.recentUsers.map((user: UserData) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatarUrl ?? undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(user.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'success' : 'destructive'}>
                        {user.isActive ? 'Hoạt động' : 'Ngưng hoạt động'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {user.createdAt
                        ? formatRelativeTime(user.createdAt)
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Không có người dùng gần đây
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface UserData {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string | null;
  role: string;
  isActive: boolean;
  createdAt?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function AdminDashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
