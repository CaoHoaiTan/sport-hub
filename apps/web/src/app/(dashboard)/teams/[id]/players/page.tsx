'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';

import { useAuth } from '@/lib/auth/context';
import { isOrganizer } from '@/lib/utils/roles';
import { ROUTES } from '@/lib/constants';
import { GET_TEAM } from '@/graphql/queries/team';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RosterManager } from '@/components/player/roster-manager';

export default function TeamPlayersPage() {
  const params = useParams();
  const { user } = useAuth();
  const id = params.id as string;

  const { data, loading } = useQuery(GET_TEAM, {
    variables: { id },
    skip: !id,
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const team = data?.team;
  if (!team) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Không tìm thấy đội.
      </div>
    );
  }

  const isMyTeam = user && team.managerId === user.id;
  const canEdit = user && (isMyTeam || isOrganizer(user.role));

  if (!canEdit) {
    return (
      <div className="text-center text-muted-foreground py-12 space-y-3">
        <Lock className="h-12 w-12 mx-auto text-muted-foreground/40" />
        <h2 className="text-lg font-semibold">Không có quyền truy cập</h2>
        <p className="text-sm">
          Chỉ quản lý đội và người tổ chức mới có thể chỉnh sửa đội hình.
        </p>
        <Button asChild variant="outline">
          <Link href={ROUTES.teamDetail(id)}>Quay lại</Link>
        </Button>
      </div>
    );
  }

  const tournament = team.tournament;
  const minPlayers = tournament?.minPlayersPerTeam ?? 1;
  const maxPlayers = tournament?.maxPlayersPerTeam ?? 25;
  const sport = tournament?.sport;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={ROUTES.teamDetail(id)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {team.name} — Quản lý VĐV
          </h1>
          <p className="text-sm text-muted-foreground">
            Yêu cầu: {minPlayers} - {maxPlayers} vận động viên
          </p>
        </div>
      </div>

      <RosterManager
        teamId={id}
        minPlayers={minPlayers}
        maxPlayers={maxPlayers}
        sport={sport}
      />
    </div>
  );
}
